> Historical technical reference. Some implementation details and score calibration examples predate the current source; consult the tests for current behavior.

# PTE Academic Full Mock Test — Content, Answer Storage & Scoring Reference

This document is the detailed companion to `PTE_MASTERY_PLATFORM.md`. It records
exactly how the full-length PTE Academic mock test is built, how answers are stored,
how every score is derived, and what is required to keep pushing a candidate from a
strong score toward a **perfect 90**.

---

## 1. What ships in the platform

| Test | Title | Items (seed/live) | Time | Purpose |
|------|-------|------------------:|-----:|---------|
| 1 | PTE Academic Official Full-Length Mock Test 1 | **49 / 45** | 120 min | Complete 2-hour simulation of the real exam |
| 2 | PTE Section Practice — Essay & Dictation Drill | 3 | 35 min | Short daily drill (1 essay, 2 dictations) |

### 1.1 Test 1 structure (seed.js builds 49 items / 19 types; live DB has 45 / 17 types — see `pte-exam.md` §11 for deltas)

**Part 1 — Speaking & Writing (seed: 24 items targeting 76–84 min; live: 22 items on 54–67 min band)**

| Item type | Count (seed/live) | Prep | Response (build/official) | Audio |
|-----------|------------------:|-----:|--------------------------:|-------|
| Read Aloud | 6 / 6 | 35 s | 40 s / 40 s | none (text visible) |
| Repeat Sentence | 10 / 4 | — | **40 s / 15 s** (D10) | plays **once** |
| Describe Image | 5 / 3 | 25 s | 40 s / 40 s | none (SVG chart visible) |
| Retell Lecture | 2 / 2 | 10 s | 40 s / 40 s | plays **once** |
| Answer Short Question | 6 / 6 | — | **12 s / 10 s** (D11) | plays **once** |
| Summarize Group Discussion | 0 / 0 | 10 s | — / 120 s | plays **once** |
| Respond to a Situation | 0 / 0 | 10 s | — / 40 s | plays **once** + text |
| Summarize Written Text | 2 / 1 | — | 600 s / 600 s | none |
| Write Essay | 1 / 2 | — | 1200 s / 1200 s | none |
| Personal Introduction (unscored) | 0 / 0 | 25 s | — / 30 s | none |

**Part 2 — Reading (seed: 13 items targeting 23–30 min; live: 13 items on 29–30 min band)**

| Item type | Count (seed/live) | Response |
|-----------|------------------:|---------:|
| Fill in the Blanks (Dropdown) | 5 / 4 | section-timed |
| Multiple Choice, Multiple Answers | 2 / 1 | section-timed |
| Reorder Paragraph | 2 / 2 | section-timed |
| Fill in the Blanks (Drag and Drop) | 4 / 5 | section-timed |
| Multiple Choice, Single Answer | 2 / 1 | section-timed |

**Part 3 — Listening (seed: 12 items targeting 31–39 min; live: 12 items on 30–43 min band) — every audio plays ONCE**

| Item type | Count (seed/live) | Response | Audio |
|-----------|------------------:|---------:|-------|
| Summarize Spoken Text | 1 / 1 | 600 s | once |
| Multiple Choice, Multiple Answers | 2 / 1 | section-timed | once |
| Fill in the Blanks (Type In) | 2 / 3 | section-timed | once |
| Highlight Correct Summary | 2 / 1 | section-timed | once |
| Multiple Choice, Single Answer | 2 / 1 | section-timed | once |
| Select Missing Word | 1 / 1 | section-timed | once |
| Highlight Incorrect Words | 0 / 0 | section-timed | once |
| Write from Dictation | 4 / 4 | section-timed | once |

**Total (seed): 49 items across 19 scored types (missing 3: SGD, RTS, HIW — `pte-exam.md` §11 D1/D2).**
**Total (live): 45 items across 17 scored types.**

> **Historical content note:** The first seeded mock contains 49 items. Local database contents depend on the commands you have run. Reseeding clears stored attempts, so use a fresh checkout or back up your data first.

---

## 2. Single-play audio policy ("no repeated playback")

Real PTE Academic never lets you replay a recording, and several of the old
media URLs in this project were dead (the Google Sounds endpoints now return
`404` and `dummyimage.com` timed out). The platform therefore renders **no
`<audio controls>` element at all** during the exam.

### 2.1 How it works

1. Each aural item's `questions.media_url` points at a **local MP3** under
   `/audio/exam/*.mp3` — all 26 seeded audio references (24 in the full mock + 2
   in the drill) are local files; **no external URLs remain**. (A legacy `tts://`
   scheme is still *supported* by the engine as a fallback, but no seeded item
   uses it — the `tts` helper in `seed.js` is dead code.)
2. On item load, `startSinglePlayAudio()` resets `audioState` and schedules an
   auto-start ~500 ms later. The auto-start is guarded by a **generation token**
   (`_audioGen`, bumped by `stopAudio()` and per render) so an old item's timer
   can never hijack a new item's playback (fixed — cross-item bleed, change log #24).
3. `begin()` sets `audioState.played = true` **before** playback starts — the
   play path can only be entered once — then calls `playFileOnce()`, which
   creates an `Audio` element with **no `<audio controls>`** in the DOM; the
   visible progress bar is driven by the element's `timeupdate` events.
4. On `ended` the status permanently becomes
   *"✓ Audio finished — it cannot be replayed."* and the play button is hidden.
5. If autoplay is blocked or the file errors, `fail()` shows a single
   **"▶ Play Audio (once only)"** button with the error message.
   ⚠️ **Known defect (historical QA note):** on the *file* path a failed start does not
   reset `played`, so that retry button is currently a no-op — fix pending.
6. Navigation calls `stopAudio()`, which bumps `_audioGen`, pauses/releases the
   element, and runs `speechSynthesis.cancel()` so no stimulus can linger or be
   re-triggered on another item.

### 2.2 How the MP3s are generated

No local TTS engine exists on this machine (`espeak-ng`, `festival`, `flite`,
`pico2wave`, `pyttsx3` all absent), so audio is **pre-generated** instead:

- `npm run generate:audio` → `uv run --with edge-tts python scripts/generate_exam_audio.py`
  renders studio-grade **Microsoft Neural voices** (`en-GB-RyanNeural`,
  `en-GB-SoniaNeural`, `en-US-AriaNeural`, mixed accents/genders to echo
  Pearson's voice variety) into `public/audio/exam/*.mp3`.
- Deterministic filenames (e.g. `rs_library_hours.mp3`) are referenced from
  `seed.js`; regenerating overwrites only files listed in the script.
- The Web Speech API (`speakOnce`) remains only as the `tts://` fallback branch.

**Consequence:** unlike the old TTS design, the stimulus now reaches the browser
as **audio bytes only** — the stimulus text is *not* in the DOM or in any JS
string the exam page loads. *(This replaces the pre-2026-09-22 browser-TTS
design; roadmap item §9.2 is complete.)*

### 2.3 Describe Image charts

`Describe Image` renders an **inline SVG chart** generated from
`questions.options.chart` (types: `bar`, `line`, `pie`). This replaces the dead
`dummyimage.com` placeholders, is fully offline, and gives real data to describe.

---

## 3. Answer storage format

Every question carries a `questions.answer_key` holding a **JSON envelope** —
never a bare string. This is the single contract that all scoring consumes.

### 3.1 Envelope fields

| Field | Used by | Meaning |
|-------|---------|---------|
| `type` | all | Discriminator; falls back to `question_type` |
| `model_answer` | all | Band-9 reference answer, shown in the scorecard |
| `key_points` | speaking, writing | Content-coverage points, matched against the response |
| `target_words` | read_aloud, RS, DI, RL, SWT, SST, essay | Expected length; drives pacing and form checks |
| `word_range` | writing, dictation | `[min, max]` enforced by the Form rule |
| `required_sentences` | Summarize Written Text only | Official one-sentence rule |
| `answers` | all fill-in-the-blank types | `{ blank1: ['accepted', 'alt'], ... }` |
| `correct` | `mcma`, `mcsa` | Array of correct labels, e.g. `["A","D"]` |
| `sequence` | `reorder_paragraphs` | Correct order, e.g. `["C","A","D","B"]` |
| `acceptable` | `answer_short_question` | Alternative accepted short answers |
| `explanations` | MCQ, reorder | Per-option reasoning reused as corrections |

### 3.2 Example

```json
{
  "type": "listening_fill_blanks",
  "answers": {
    "blank1": ["others'", "others"],
    "blank2": ["replacing", "changing", "substituting"],
    "blank3": ["acknowledged", "cited", "referenced", "credited"]
  },
  "model_answer": "others' / replacing / acknowledged"
}
```

### 3.3 Companion columns on `questions`

| Column | Purpose |
|--------|---------|
| `part`, `part_title` | 1/2/3 grouping for section breaks and the scorecard |
| `audio_play_policy` | `'once'` or `'none'` — drives the single-play engine |
| `prep_seconds`, `time_limit_seconds` | authentic per-item timers |
| `model_answer` | duplicate of the envelope for quick reporting |
| `rubric` | reserved for explicit per-component weights |
| `scored_enabling` | which of the six enabling skills this item feeds |

### 3.4 Security

`GET /api/tests/:id` **withholds** `answer_key` and `model_answer` from the exam
client (`publicQuestion()` strips them). Charts, word banks and MCQ choices are
delivered; answers are not. Answers only reappear on
`GET /api/attempts/:id` after submission.

---

## 4. Response storage (what makes analysis possible)

`user_responses` now stores, per item:

| Column | Contents |
|--------|----------|
| `text_response` | typed answer, or JSON for blanks/MCQ/reorder |
| `audio_file_path` | uploaded recording (`uploads/audio/…`) |
| `transcript` | reserved for real speech-to-text |
| `score` / `max_score` | **10–90 scale**, `max_score = 90` |
| `sub_scores` | JSON: per-rubric-component ratios, e.g. `{"content":0.83,"form":1,"grammar":0.94,"vocabulary":0.89,"spelling":1,"written_discourse":1}` |
| `metrics` | JSON: `word_count`, `sentence_count`, `accuracy_pct`, `words_correct/expected`, `key_points_matched`, `cohesion_markers`, `blanks_correct`, `durationSeconds`, per-blank `details` |
| `time_spent_seconds` | time actually spent on the item |

`test_attempts` stores the aggregate **section scores** and all **six enabling
skills** (the previously unused `enabling_*` columns are now populated, plus a new
`enabling_spelling`).

`mistake_logs` records every flagged error with a strict category set:

```
Grammar | Spelling | Vocabulary | Fluency | Form/Length | Content | Punctuation
```

each with `candidate_output`, `exact_mistake`, `model_correction`, `score_impact`
and a `status` of `unresolved → practicing → mastered`.

### 4.1 Migrations

SQLite has no `ADD COLUMN IF NOT EXISTS`, so `database/db.js` inspects
`PRAGMA table_info` and adds only missing columns on every boot. Existing
`practice.db` files upgrade in place; fresh installs get them from `schema.sql`.

---

## 5. Scoring model

### 5.1 The 10–90 scale

Every item converts a `0..1` quality ratio to the official PTE range:

```
score = round(10 + ratio × 80)      // 10 = floor, 90 = superior
```

Section score = mean of that section's item scores.
Overall score = mean of the four section scores (sections that had no items are
excluded).

### 5.2 Written task weights

| Component | Write Essay | Summarize Written Text | Summarize Spoken Text |
|-----------|------------:|-----------------------:|----------------------:|
| Content | 0.25 | 0.30 | 0.35 |
| Form (word/sentence range) | 0.15 | 0.15 | 0.15 |
| Grammar | 0.25 | 0.25 | 0.20 |
| Vocabulary | 0.15 | 0.20 | 0.15 |
| Spelling | 0.10 | 0.05 | 0.10 |
| Written Discourse | 0.10 | 0.05 | 0.05 |

### 5.3 Speaking tasks

Speaking is scored on three sub-components: **content, oral fluency,
pronunciation**, averaged equally.

* **Presence** — no recording, or a recording under 1.5 s, floors the item.
* **Pacing** — the recording is compared with the time needed to deliver
  `target_words` at ~150 wpm (`target_words / 2.5` seconds), **not** with the
  whole response window. A correct 12-word Repeat Sentence spoken in 8 seconds is
  perfect, not "rushed". Overrunning the response window or trailing off early
  both reduce fluency.
* **Content cap** — without transcription we cannot verify what was said, so
  content is capped at **0.8**. Unverified speech therefore cannot claim 90; this
  is deliberate honesty, and it is the single largest reason a perfect candidate
  currently stops at 88.

### 5.4 Objective tasks

| Type | Rule |
|------|------|
| Fill-in-the-blanks | per-blank exact match after normalisation; score = correct/total |
| `mcsa` | full credit only for the single correct option |
| `mcma` | `max(0, hits − false_positives) / correct` — wrong ticks are penalised |
| `reorder_paragraphs` | exact sequence = full credit, otherwise scored on correctly-ordered **adjacent pairs** |
| Write from Dictation | ordered word-by-word matching, `matched / expected`, 90% weight + 10% spelling |

### 5.5 Normalisation rules

Matching lowercases, strips punctuation, collapses whitespace, and treats
UK/US variants as equal (`-isation`/`-ization`, `-ise`/`-ize`), so a candidate
writing *fertilisation* is not marked wrong for an answer key of *fertilization*.

### 5.6 Deliberate guards (bugs found and fixed during calibration)

1. **Spelling dictionary self-maps.** The original map contained
   `'environment': 'environment'`, `'publicly': 'publicly'`,
   `'fertilise': 'fertilise'` — correctly spelled words were flagged as errors.
   Rebuilt as genuine `wrong → correction` pairs only; valid UK/US variants
   never appear. Spelling is now a pure defect rate
   (`1 − flagged/words`), so a flawless dictation earns 1.0 regardless of length.
2. **Pacing model.** Previously compared duration against the full response
   window, which punished short correct answers (Repeat Sentence scored 50).
3. **Run-on rule vs. mandatory single sentence.** Summarize Written Text
   *requires* one long sentence, so the `>35 words = run-on` rule was applied to
   every correct answer. Now suppressed for tasks whose `word_range` max is
   ≤ 75 words (SWT and SST).
4. **Discourse markers.** Cohesion detection now includes subordinating devices
   (`because`, `although`, `while`, `which`, `demonstrating`, `thereby`) and
   semicolon-linked clauses, so a well-built single-sentence summary is not told
   it has "no cohesion".
5. **Academic vocabulary detection** uses word **stems**
   (`demonstrat`, `infrastructure`, `constraint`, `urbanis/urbaniz`, …) instead of
   exact words, so inflected forms count.
6. **Flawless-response ceiling.** The grammar base was raised 7.5 → 8.5 of 9 so a
   clean answer is not permanently capped near 77.

---

## 6. Analysis endpoints

### `GET /api/attempts/:id`

Full attempt with every response (`feedback`, `sub_scores`, `metrics`,
`answer_key`, `model_answer`) plus all `mistake_logs`.

### `GET /api/attempts/:id/analysis`

Returns the "path to 90" payload:

```json
{
  "overall_score": 88,
  "gap_to_90": 2,
  "sections": { "speaking": 84, "writing": 87, "reading": 90, "listening": 90 },
  "enabling_ranked": [
    { "skill": "pronunciation", "score": 84, "gap": 6 },
    { "skill": "discourse",     "score": 82, "gap": 8 }
  ],
  "item_types_ranked": [
    { "type": "repeat_sentence", "average": 83, "count": 4, "gap_to_90": 7 }
  ],
  "mistakes_by_category": [
    { "category": "Spelling", "count": 30 }
  ],
  "total_time_seconds": 4820,
  "recommendations": [
    { "priority": "high", "area": "pronunciation",
      "action": "Lift pronunciation from 84 to 90 — it is your lowest enabling skill..." }
  ]
}
```

`recommendations` are generated from the two lowest enabling skills, up to three
item types with a ≥ 25-point gap, and the most frequent mistake category.

### `GET /api/attempts` and `npm run evaluate [id]`

Attempt history, and a CLI re-scoring agent (`database/evaluator_agent.js`) that
recomputes an attempt from stored responses, rewrites the mistake vault, and
prints a printable scorecard with per-enabling-skill gaps.

---

## 7. Exam-flow behaviours

* **No going back.** The "Previous" control was removed; the engine states
  *"You cannot return to a previous item."* — matching the real exam.
* **Section breaks.** Crossing into Part 2 or Part 3 shows an interstitial with
  the item count, expected minutes and the listening rules, requiring an explicit
  *Begin Part* click.
* **Dual timers.** A total 120-minute countdown plus a per-item response timer
  that turns rose at zero.
* **Automatic preparation countdowns** for Read Aloud / Describe Image /
  Re-tell Lecture, auto-starting the microphone at zero.
* **Speaking items with audio** wait for playback to finish before revealing the
  record button, then show `GO`.
* **Live waveform** on a canvas during recording; duration is captured and sent
  with the response for pacing analysis.
* **Word counters** update live on every writing task with the target range shown.
* **Re-order paragraphs** use ▲/▼ controls that persist the chosen sequence.

---

## 8. Calibration results

Three synthetic candidates submitted against the **49-item** test (current `seed.js` build — live DB still 45 until re-seed):

| Candidate | Overall | Speaking | Writing | Reading | Listening | Mistakes |
|-----------|--------:|---------:|--------:|--------:|----------:|---------:|
| **Perfect** (every answer correct) | **88 / 90** | 84 | 87 | 90 | 90 | **0** |
| Average (plausible but weak) | 34 / 90 | 60 | 48 | 12 | 17 | 114 |
| Empty (all items left blank) | 10 / 90 | 10 | 10 | 10 | 10 | 103 |

Perfect-candidate enabling skills:

```
grammar 86   spelling 90   fluency 90
pronunciation 84   vocabulary 89   discourse 82
```

**Interpretation.** The scale is honestly calibrated: a flawless candidate lands
at 88 with zero flagged errors, reading and listening both hit the 90 ceiling,
and a blank submission sits on the 10-point floor rather than an implausible 0.
The 2-point residual gap is almost entirely **unverified speaking content** (§5.3)
— the documented next step toward an actual 90.

> **Recalibration required:** After `node database/seed.js` (which wipes attempts),
> re-run the calibration ladder immediately to re-verify the 88/34/10 ladder
> against the 49-item bank. Use a separate test database.

---

## 9. Roadmap to a verified 90

1. **Speech-to-text for speaking items.** Store a real `transcript` per recording
   (Whisper-class local model or an API). The evaluator already prefers a genuine
   transcript when present and scores content against `key_points`; this alone
   removes the 0.8 content cap and lets Speaking reach 90.
2. ~~**Server-side audio generation.**~~ ✅ **Done 2026-09-22** — every seeded
   aural item now plays a local **MP3** generated with edge-tts
   (`npm run generate:audio`); the browser no longer receives stimulus text
   (§2.2). Remaining polish: voice/accent rotation review and retiring the
   dead `tts` helper + `tts://` fallback branch once QA's audio fixes land.
3. **Pronunciation signal.** With recordings retained, analyse speech rate,
   pause distribution and filled-pause frequency instead of inferring
   pronunciation from pacing.
4. **Per-item rubrics.** Populate the reserved `questions.rubric` column so task
   weights are data, not code.
5. **Spelling dictionary growth.** Replace the hand-built map with a bundled
   word list (e.g. `/usr/share/dict/words`) for real dictionary-based checking.
6. **Attempt-to-attempt trends.** The data model already supports it — chart
   section and enabling-skill movement across repeated attempts.
7. **Mistake mastery loop.** Drive the `unresolved → practicing → mastered`
   statuses from the vault so corrections are re-tested on later attempts.

---

## 10. Running it

```bash
npm install            # express, cors, multer, sqlite3 (already present)
npm run seed           # = node database/seed.js — rebuild both tests (49 + 3)
                       #  ⚠️ WIPES every attempt incl. calibration #18–20
npm run generate:audio # regenerate exam MP3s (edge-tts via uv)
node server.js         # http://localhost:3000 (override: PORT=3999 node server.js)
npm run evaluate 7     # re-score attempt #7 and print its scorecard
```

Key routes: `/api/tests`, `/api/tests/:id`, `/api/upload-audio`,
`/api/submit-test`, `/api/attempts`, `/api/attempts/:id`,
`/api/attempts/:id/analysis`.
