#!/usr/bin/env python3
"""
Generate single-play MP3 audio for every generated aural question.

Reads questions with audio_play_policy = 'once' whose media_url points at
/audio/exam/gen/, takes the spoken script from answer_key['script']
(falling back to model_answer for Repeat Sentence / WFD), and renders it with
edge-tts neural voices in the Pearson accent mix (AU / GB / US).

Only revised v2 content-addressed media is generated. Legacy audio is untouched.
Resume-safe: MP3s are skipped only with a matching script/MP3 integrity receipt.

Usage:
  uv run --with edge-tts python scripts/generate_audio_bulk.py
  uv run --with edge-tts python scripts/generate_audio_bulk.py --force
  uv run --with edge-tts python scripts/generate_audio_bulk.py --limit 20
"""
import argparse
import asyncio
import json
import os
import random
import sys

from audio_receipt import audio_is_current, script_hash, write_receipt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
DB_PATH = os.path.join(ROOT, "database", "practice.db")
OUT_DIR = os.path.join(ROOT, "public", "audio", "exam", "gen")
MEDIA_PREFIX = "/audio/exam/gen/v2/"

VOICES = [
    "en-AU-NatashaNeural",
    "en-AU-WilliamMultilingualNeural",
    "en-GB-RyanNeural",
    "en-GB-SoniaNeural",
    "en-US-ChristopherNeural",
    "en-US-JennyNeural",
]
RATE = {
    "repeat_sentence": "+0%",
    "write_from_dictation": "-5%",
    "answer_short_question": "+0%",
}


def load_items(db_path=DB_PATH):
    import sqlite3

    con = sqlite3.connect('file:' + db_path + '?mode=ro', uri=True)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        """SELECT q.id, q.question_type, q.item_order, q.media_url, q.answer_key,
                  t.title AS test_title
           FROM questions q JOIN tests t ON t.id = q.test_id
           WHERE q.audio_play_policy = 'once'
             AND q.media_url LIKE ? || '%'
           ORDER BY q.test_id, q.item_order""",
        (MEDIA_PREFIX,),
    ).fetchall()
    con.close()

    items = []
    seen_paths = set()
    for r in rows:
        try:
            key = json.loads(r["answer_key"] or "{}")
        except json.JSONDecodeError:
            key = {}
        script = key.get("script") or key.get("model_answer") or ""
        script = str(script).strip()
        if not script or len(script) < 4:
            raise ValueError(f"Question {r['id']} has no script")
        expected_url = MEDIA_PREFIX + script_hash(script) + '.mp3'
        if r['media_url'] != expected_url:
            raise ValueError(f"Question {r['id']}: audio URL does not match script hash")
        out_name = r["media_url"].lstrip("/")              # audio/exam/gen/xxx.mp3
        if out_name in seen_paths:
            continue
        seen_paths.add(out_name)
        items.append(
            {
                "id": r["id"],
                "type": r["question_type"],
                "script": script,
                "voice": VOICES[int(script_hash(script)[:8], 16) % len(VOICES)],
                "rate": RATE.get(r["question_type"], "+0%"),
                "path": os.path.join(ROOT, "public", out_name),
            }
        )
    return items


async def synth(item, sem, stats):
    import edge_tts
    async with sem:
        for attempt in range(4):
            try:
                os.makedirs(os.path.dirname(item["path"]), exist_ok=True)
                tmp = item["path"] + ".part"
                comm = edge_tts.Communicate(item["script"], item["voice"], rate=item["rate"])
                await comm.save(tmp)
                size = os.path.getsize(tmp)
                if size < 1000:
                    raise RuntimeError(f"output too small ({size} bytes)")
                os.replace(tmp, item["path"])
                write_receipt(item)
                stats["ok"] += 1
                if stats["ok"] % 50 == 0:
                    print(f"  · {stats['ok']}/{stats['total']} generated")
                return
            except Exception as exc:  # noqa: BLE001 — retry transient TTS failures
                if attempt == 3:
                    stats["fail"].append((item["id"], str(exc)))
                    print(f"  ! FAILED q{item['id']} ({item['type']}): {exc}")
                    return
                await asyncio.sleep(1.5 * (2 ** attempt) + random.random())


async def main_async(items, workers):
    stats = {"ok": 0, "fail": [], "total": len(items)}
    sem = asyncio.Semaphore(workers)
    await asyncio.gather(*(synth(it, sem, stats) for it in items))
    return stats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--force", action="store_true", help="regenerate existing files too")
    ap.add_argument("--database", default=DB_PATH, help="staging database to read (never modified)")
    ap.add_argument("--verify-only", action="store_true", help="check every script/MP3 receipt without generating audio")
    args = ap.parse_args()

    items = load_items(os.path.abspath(args.database))
    if not items:
        print('No revised v2 audio items found; refusing to claim media verification.')
        return 1
    todo = []
    skipped = 0
    for it in items:
        if not args.force and audio_is_current(it):
            skipped += 1
            continue
        todo.append(it)
    if args.verify_only:
        print(f'Audio integrity: {skipped}/{len(items)} verified; {len(todo)} missing or stale.')
        return 1 if todo else 0
    if args.limit:
        todo = todo[: args.limit]

    print(f"Audio generation: {len(todo)} to render, {skipped} already present "
          f"({len(items)} aural items total), workers={args.workers}")
    if not todo:
        print("Nothing to do.")
        return 0

    stats = asyncio.run(main_async(todo, args.workers))
    print(f"\nDone: {stats['ok']} generated, {len(stats['fail'])} failed, {skipped} skipped.")
    if stats["fail"]:
        for qid, err in stats["fail"][:20]:
            print(f"  failed q{qid}: {err}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
