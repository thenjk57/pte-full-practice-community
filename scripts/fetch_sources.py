#!/usr/bin/env python3
"""
Download openly licensed source material for the PTE mock-test content bank.

Sources
  1. Wikipedia (en.wikipedia.org)          — CC BY-SA 4.0, plaintext extracts
  2. Project Gutenberg via Gutendex        — public domain, plain text books

The generator (database/generate_mock_bank.js) turns these sources into
ORIGINAL PTE-format questions. No Pearson test content is downloaded or used.

Outputs (all under content/sources/):
  wiki/<slug>.json          { title, url, domain, license, extract }
  gutenberg/<id>.txt        raw public-domain text
  manifest.json             index of everything downloaded
  ATTRIBUTION.csv           title, url, license, domain for CC BY-SA compliance

Resume-safe: files already on disk are skipped.
Usage:  python3 scripts/fetch_sources.py [--wiki 1000] [--gutenberg 40]
"""
import argparse
import concurrent.futures as cf
import csv
import json
import os
import random
import re
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "content", "sources"))
WIKI_DIR = os.path.join(OUT, "wiki")
GUT_DIR = os.path.join(OUT, "gutenberg")

UA = "PTEFullPracticeContentBot/1.0 (local practice-test content generator; personal use)"
WIKI_API = "https://en.wikipedia.org/w/api.php"
CC_LICENSE = "CC BY-SA 4.0"

# ---------------------------------------------------------------------------
# Seed titles per academic domain — expansion happens via each article's links.
# ---------------------------------------------------------------------------
SEEDS = {
    "environment": [
        "Climate change", "Ocean acidification", "Renewable energy", "Biodiversity",
        "Deforestation", "Water scarcity", "Carbon footprint", "Sustainable development",
        "Waste management", "Coral reef",
    ],
    "biology": [
        "Photosynthesis", "Natural selection", "Human microbiome", "Neuroplasticity",
        "Enzyme", "Cell division", "Marine biology", "Genetics", "Immune system", "Ecology",
    ],
    "health": [
        "Vaccination", "Antibiotic resistance", "Mental health", "Nutrition",
        "Epidemiology", "Sleep", "Public health", "Cardiovascular system", "Diabetes", "Obesity",
    ],
    "physics_chem": [
        "Quantum mechanics", "Thermodynamics", "Electromagnetism", "Nuclear power",
        "Chemical bond", "Materials science", "Optics", "Fluid mechanics", "Semiconductor", "Radioactivity",
    ],
    "space": [
        "Solar System", "Black hole", "Star", "Mars", "Exoplanet", "Galaxy",
        "Cosmology", "Satellite", "Astronomy", "Space exploration",
    ],
    "tech": [
        "Artificial intelligence", "Computer network", "Robotics", "Cryptography",
        "Database", "Internet", "Machine learning", "Cybersecurity", "Software engineering", "Cloud computing",
    ],
    "economics": [
        "Supply and demand", "Inflation", "International trade", "Labor market",
        "Economic growth", "Public finance", "Globalization", "Monetary policy", "Poverty", "Housing market",
    ],
    "history": [
        "Industrial Revolution", "Ancient Rome", "Silk Road", "World War I",
        "Colonialism", "Agricultural Revolution", "Printing press", "Ottoman Empire", "Cold War", "Archaeology",
    ],
    "urban": [
        "Urbanization", "Public transport", "Urban planning", "Housing",
        "Smart city", "Traffic congestion", "Architecture", "Rural development", "Land use", "Municipal government",
    ],
    "education": [
        "Language acquisition", "Educational psychology", "Critical thinking", "Bilingualism",
        "Standardized test", "Higher education", "Curriculum", "Memory", "Reading", "Academic writing",
    ],
    "social": [
        "Social inequality", "Demography", "Cultural relativism", "Migration",
        "Gender inequality", "Crime prevention", "Social media", "Community", "Aging population", "Human rights",
    ],
    "agri": [
        "Agriculture", "Soil conservation", "Irrigation", "Crop rotation",
        "Food security", "Aquaculture", "Organic farming", "Livestock", "Pollination", "Genetically modified organism",
    ],
    "earth": [
        "Water cycle", "Volcano", "Earthquake", "Climate", "Glacier",
        "Weathering", "Groundwater", "Atmosphere", "Desertification", "Plate tectonics",
    ],
    "arts": [
        "Literature", "Music", "Film", "Museum", "Architecture",
        "Language", "Philosophy", "Linguistics", "Journalism", "Theatre",
    ],
    "law_gov": [
        "Constitutional law", "Intellectual property", "Democracy", "Environmental law",
        "Human trafficking", "Privacy", "Judicial review", "Federalism", "Anti-corruption", "Refugee",
    ],
}

GUT_TOPICS = ["science", "history", "economics", "philosophy", "geography", "biology", "sociology"]

BAD_TITLE = re.compile(
    r"^(list of|index of|outline of|glossary of|timeline of|table of|"
    r"category:|file:|template:|portal:|wiktionary:)", re.I)


def http_get(url, tries=6, pause=1.5, timeout=45):
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except Exception as exc:  # noqa: BLE001 — retry anything transient
            last = exc
            time.sleep(pause * (2 ** attempt))
    raise RuntimeError(f"GET failed after {tries} tries: {url} ({last})")


def wiki_api(params):
    params = dict(params, format="json", formatversion="2")
    return json.loads(http_get(WIKI_API + "?" + urllib.parse.urlencode(params)))


def slugify(title):
    return re.sub(r"[^A-Za-z0-9]+", "_", title).strip("_")[:90]


def good_title(t):
    if not t or len(t) < 6 or len(t) > 72:
        return False
    if BAD_TITLE.search(t):
        return False
    if "(disambiguation)" in t.lower():
        return False
    if "(" in t or "–" in t or "—" in t:
        return False
    return True


def collect_candidate_titles(limit):
    """Expand seed titles via their outgoing article links (namespace 0)."""
    pool = set()
    per_domain = {}
    for domain, seeds in SEEDS.items():
        for title in seeds:
            try:
                data = wiki_api({
                    "action": "query", "titles": title, "prop": "links",
                    "pllimit": "500", "plnamespace": "0", "redirects": "1",
                })
            except Exception as exc:  # noqa: BLE001
                print(f"  ! links fetch failed for {title}: {exc}")
                continue
            for page in data.get("query", {}).get("pages", []):
                for link in page.get("links", []):
                    t = link.get("title", "")
                    if good_title(t):
                        pool.add(t)
                        per_domain.setdefault(t, domain)
            time.sleep(0.05)
        print(f"  · {domain}: pool now {len(pool)}")
        if len(pool) >= limit * 4:
            break
    # Keep seed titles themselves too.
    for domain, seeds in SEEDS.items():
        for t in seeds:
            if good_title(t):
                pool.add(t)
                per_domain.setdefault(t, domain)
    titles = sorted(pool)
    random.Random(20260922).shuffle(titles)
    # Ensure all seeds are taken first.
    seeds_all = {t for ss in SEEDS.values() for t in ss if good_title(t)}
    ordered = sorted(seeds_all) + [t for t in titles if t not in seeds_all]
    return ordered[:limit], per_domain


def fetch_extract(title):
    try:
        data = wiki_api({
            "action": "query", "titles": title, "prop": "extracts",
            "explaintext": "1", "exsectionformat": "plain", "redirects": "1",
        })
    except Exception as exc:  # noqa: BLE001
        return None, f"{title}: {exc}"
    pages = data.get("query", {}).get("pages", [])
    if not pages or pages[0].get("missing"):
        return None, f"{title}: missing"
    text = pages[0].get("extract") or ""
    if len(text) < 1500:
        return None, f"{title}: too short"
    final_title = pages[0].get("title", title)
    return {
        "title": final_title,
        "url": "https://en.wikipedia.org/wiki/" + urllib.parse.quote(final_title.replace(" ", "_")),
        "license": CC_LICENSE,
        "extract": text[:60000],
    }, None


def save_wiki(item, domain):
    path = os.path.join(WIKI_DIR, slugify(item["title"]) + ".json")
    if os.path.exists(path):
        return path, True
    item = dict(item, domain=domain)
    tmp = path + ".part"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(item, fh, ensure_ascii=False)
    os.replace(tmp, path)
    return path, False


def fetch_gutenberg(args):
    """Download public-domain plain-text books (copyright == False) via Gutendex."""
    os.makedirs(GUT_DIR, exist_ok=True)
    got, seen_ids = [], set()
    for topic in GUT_TOPICS:
        if len(got) >= args.gutenberg:
            break
        per_topic = max(3, args.gutenberg // len(GUT_TOPICS) + 1)
        url = f"https://gutendex.com/books/?media_type=text&topic={urllib.parse.quote(topic)}&page=1"
        try:
            data = json.loads(http_get(url))
        except Exception as exc:  # noqa: BLE001
            print(f"  ! gutendex topic '{topic}' failed: {exc}")
            continue
        for book in data.get("books", []):
            if len(got) >= args.gutenberg:
                break
            if book.get("copyright") is not False or book["id"] in seen_ids:
                continue
            formats = book.get("formats", {})
            txt_url = None
            for key in formats:
                if key.startswith("text/plain") and "utf-8" in key:
                    txt_url = formats[key]
                    break
            if not txt_url:
                for key in formats:
                    if key.startswith("text/plain"):
                        txt_url = formats[key]
                        break
            if not txt_url or not txt_url.startswith("http"):
                continue
            path = os.path.join(GUT_DIR, f"{book['id']}.txt")
            if os.path.exists(path):
                got.append({"id": book["id"], "title": book["title"], "file": os.path.basename(path),
                            "url": f"https://www.gutenberg.org/ebooks/{book['id']}",
                            "license": "Public domain", "topic": topic})
                seen_ids.add(book["id"])
                continue
            try:
                raw = http_get(txt_url, timeout=60)[:800000]
            except Exception as exc:  # noqa: BLE001
                print(f"  ! gutenberg {book['id']} download failed: {exc}")
                continue
            with open(path, "wb") as fh:
                fh.write(raw)
            got.append({"id": book["id"], "title": book["title"], "file": os.path.basename(path),
                        "url": f"https://www.gutenberg.org/ebooks/{book['id']}",
                        "license": "Public domain", "topic": topic})
            seen_ids.add(book["id"])
            print(f"  · gutenberg [{len(got)}] {book['title'][:60]}")
            time.sleep(0.2)
        time.sleep(0.3)
    return got


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wiki", type=int, default=1000)
    ap.add_argument("--gutenberg", type=int, default=40)
    ap.add_argument("--workers", type=int, default=2,
                    help="extract fetchers — Wikipedia 429s above ~2 concurrent")
    args = ap.parse_args()

    os.makedirs(WIKI_DIR, exist_ok=True)
    os.makedirs(GUT_DIR, exist_ok=True)

    print(f"[1/3] Expanding seed articles -> candidate titles (target {args.wiki})...")
    titles, per_domain = collect_candidate_titles(args.wiki)
    print(f"  → {len(titles)} candidate titles selected")

    # resume: titles already on disk are not re-fetched
    todo = [t for t in titles
            if not os.path.exists(os.path.join(WIKI_DIR, slugify(t) + ".json"))]
    already = len(titles) - len(todo)
    print(f"[2/3] Fetching extracts with {args.workers} workers "
          f"({already} already on disk, {len(todo)} to fetch)...")
    failed = []
    with cf.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(fetch_extract, t): t for t in todo}
        done = 0
        for fut in cf.as_completed(futures):
            item, err = fut.result()
            if item:
                save_wiki(item, per_domain.get(futures[fut], "general"))
            else:
                failed.append(err)
            done += 1
            if done % 100 == 0:
                print(f"  · {done}/{len(todo)} attempted, "
                      f"{len(failed)} failed so far")

    print(f"[3/3] Gutenberg books (target {args.gutenberg})...")
    gbooks = fetch_gutenberg(args)

    # manifest reflects EVERYTHING on disk (this run + previous runs)
    wiki_on_disk = []
    for fn in sorted(os.listdir(WIKI_DIR)):
        if not fn.endswith(".json"):
            continue
        try:
            it = json.loads(open(os.path.join(WIKI_DIR, fn), encoding="utf-8").read())
        except Exception:  # noqa: BLE001
            continue
        wiki_on_disk.append({
            "title": it["title"], "url": it["url"], "license": it["license"],
            "domain": it.get("domain", per_domain.get(it["title"], "general")),
            "file": "wiki/" + fn,
        })
    wiki_on_disk.sort(key=lambda x: x["title"].lower())

    manifest = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "wiki": wiki_on_disk,
        "gutenberg": gbooks,
        "wiki_count": len(wiki_on_disk),
        "gutenberg_count": len(gbooks),
        "failures": failed[:200],
    }
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)

    with open(os.path.join(OUT, "ATTRIBUTION.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["title", "url", "license", "domain", "source"])
        for it in manifest["wiki"]:
            w.writerow([it["title"], it["url"], it["license"], it["domain"], "Wikipedia"])
        for b in gbooks:
            w.writerow([b["title"], b["url"], b["license"], b.get("topic", ""), "Project Gutenberg"])

    print(f"\nDone: {len(wiki_on_disk)} Wikipedia articles, {len(gbooks)} Gutenberg books, "
          f"{len(failed)} failures")
    print(f"Outputs in {OUT}")
    if len(wiki_on_disk) < 300:
        print("WARNING: fewer than 300 articles saved — check failures in manifest.json")
        sys.exit(2)


if __name__ == "__main__":
    main()
