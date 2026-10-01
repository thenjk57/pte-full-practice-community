# Question quality fixes: isolated review

Branch: `codex/fix-question-difficulty`.

The running LAN checkout is not part of this change. Do not restart its service,
replace its database, or regenerate its audio during an active attempt.

## Changes

- Parse plain source headings as well as wiki markup. Headings no longer become
  part of spoken passages; reference/bibliography tails are excluded.
- Filter citation identifiers, specialist gene codes, conservative species-name
  patterns, protocol acronym lists, and dense rare long-word vocabulary.
- Select blank answers and distractors from lowercase vocabulary present in at
  least ten distinct source documents. Repetition within one document does not
  qualify a word. This removes examples such as `oblanceolata` and `gymnosperms`.
- Apply the same checks to all pools, including dictation and short sentences,
  then validate complete questions before any insertion.
- Fail generation if suitable distractors cannot be found instead of inventing
  placeholder answers such as `option1`.

These are content-selection heuristics, not official Pearson difficulty
calibration. Normal science, percentages, years and academic vocabulary remain
eligible. The heuristics cannot identify every specialist term or guarantee
every generated question is pedagogically sound. Timers are unchanged. Historical
scores are not rewritten; new recorded short answers without transcripts are
pending review, not automatically marked wrong.

## Regression examples

| Previous defect | New guard |
| --- | --- |
| `MT-ATP8`, `MT-ATP6`, `mtDNA` in a speaking passage | Genetic-notation filter |
| `Tmesipteris oblanceolata` as source and blank answer | Species-pattern filter plus document-frequency eligibility |
| DOI/PMID bibliography fragments in reading tasks | Section exclusion plus citation filter |
| `Bioactivity and toxicity testing` appended to a sentence | Plain heading extraction |
| CLSI/ISO/NIH/EURL/ECVAM/OECD list in Read Aloud | Dense acronym-list filter |
| `diderm`, `monoderm` specialist terminology | Specialist-terminology filter |

## Verification

From the isolated worktree, with the source corpus and dependencies installed:

```sh
npm test
env -u PTE_DATA_DIR node database/generate_mock_bank.js --dry
git diff --check
python3 scripts/generate_audio_bulk.py --verify-only
env -u PTE_DATA_DIR node database/generate_mock_bank.js --verify-media
```

The full bank check covers mocks 2–30 (29 mocks, 1,305 questions), preserving the
45-item layout and answer-key contracts. The original first mock is unchanged.
Generated databases and corpus files are not included in the fix commit.

## Release remains separate

No fixes have been deployed. The isolated database contains an earlier preview
bank plus the distinctly titled `Revised v2` bank. Only the revised bank uses
fresh, content-addressed audio. Do not copy this development database over the
live database.

## Audio and evidence corrections

Legacy media names identify an item position, not its content. Rebuilding a
bank could change its script while keeping the same URL; the old renderer skipped
existing MP3s based only on size. Candidate responses from attempt 51 indicate
this mismatch in a military summary and two unrelated dictation topics.

- Revised MP3 names contain the SHA-256 hash of the exact script and use a new
  `/audio/exam/gen/v2/` namespace. Old media is never overwritten by this tool.
- Each new MP3 has a receipt containing script hash, MP3 hash, voice and rate.
  Resume skips only matching receipts, not arbitrary existing files.
- The generation tool opens the staging database read-only, refuses mismatched
  content-addressed URLs, and fails verification if any audio is missing/stale.
- Complete bank validation checks correct listening MCQ statements against the
  script, reconstructs listening fill-in-the-blank transcripts, and checks the
  clauses of generated correct summaries against their recording scripts.
- Read Aloud word comparison targets the passage instead of the instructions.
  Without a transcript, no word-level correctness is invented. Speaking scores
  remain practice proxies, not independently verified pronunciation scores.
- Recorded ASQs without transcripts have null scores and are excluded pending
  review. New aggregates report the pending count as provisional. Empty,
  unattempted responses still receive the ordinary floor. The report displays
  pending review instead of a fabricated zero and no longer labels missing pace
  data as "Optimal".

Receipts establish generation provenance and file integrity, not independent
speech recognition or human listening verification. They do not certify the
pedagogical quality or official Pearson calibration of these mocks.

After active attempts finish, prepare a separately reviewed release:

1. Take a consistent SQLite backup and preserve existing attempts, response
   recordings, question IDs, and media. A raw copy of a running database is not
   the backup procedure.
2. Build the final bank in a fresh staging database. Publish revised mocks under
   distinct versioned titles and new IDs alongside the originals. The existing
   generator skips already populated titles; running it on the live database
   will not update those questions, and `--force` remains disabled.
3. Generate and verify every revised recording in staging using the v2 namespace
   and integrity receipts, then sample passages, answers, and audio together.
4. Review and explicitly authorize the additive rollout, test a complete new
   attempt, and retain the original bank for old attempts and rollback.

This branch regenerates only staging media. No live rollout, live database
backup/replacement, historical rescoring, or service change has been performed.
