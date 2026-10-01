# Content Sources — Openly Licensed Material for the PTE Mock Bank

This directory holds the **downloaded source material** that
`database/generate_mock_bank.js` turns into original PTE-format questions for
the 29 generated full mock tests (tests 2–30).

**No Pearson / official PTE test content is downloaded, copied or used at any
point.** Questions are original compositions; only the underlying reading and
listening *subject matter* comes from openly licensed sources, and every
derived item records its provenance in `answer_key.source = { title, url,
license }`.

## What is stored here

| Path | Source | License | Count |
|------|--------|---------|------:|
| `wiki/*.json` | [Wikipedia](https://en.wikipedia.org) plaintext extracts | **CC BY-SA 4.0** (see [Wikipedia:Copyrights](https://en.wikipedia.org/wiki/Wikipedia:Copyrights)) | **1098 articles** |
| `gutenberg/*.txt` | [Project Gutenberg](https://www.gutenberg.org) plain-text books | **Public domain** (confirmed via Gutendex `copyright: false`) | 0 this run — Gutendex was unavailable (timeouts/503); optional for the generator, re-run `npm run fetch:sources` to add them |
| `manifest.json` | index of every downloaded item (title, URL, license, domain) | — | — |
| `ATTRIBUTION.csv` | machine-readable attribution table required by CC BY-SA | — | 1099 lines |

## Attribution policy (CC BY-SA 4.0)

1. `ATTRIBUTION.csv` records title, URL, license and domain for every
   Wikipedia article used — this satisfies the "reasonable to the medium"
   attribution requirement for generated excerpts.
2. Each generated question carries `answer_key.source` with the originating
   article's title and URL, so provenance travels with the database.
3. Extracts are stored verbatim; generated questions are original in wording
   and structure. Where a question reuses sentences (e.g. Repeat Sentence or
   Write from Dictation items), the source article URL is recorded on the item.

## Refreshing / extending the corpus

```bash
python3 scripts/fetch_sources.py --wiki 1000 --gutenberg 40   # resume-safe
node database/generate_mock_bank.js                           # add missing generated tests
uv run --with edge-tts python scripts/generate_audio_bulk.py  # regenerate audio
```

The fetcher is resume-safe (existing files are skipped) and polite
(**2 workers** by default — Wikipedia answers higher concurrency with HTTP
429 — exponential backoff, descriptive User-Agent). The manifest and
`ATTRIBUTION.csv` are rebuilt from **everything on disk** on every run, so
partial re-runs never lose earlier downloads.
