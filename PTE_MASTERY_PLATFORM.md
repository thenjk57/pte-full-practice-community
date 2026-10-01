# PTE Academic 90-Mastery Platform: System Architecture & Strategy

> **Scope note:** claims about the *real exam* in this file are secondary — the
> canonical reference is **`pte-exam.md`** (official Pearson sources). Claims
> This is a historical architecture note. Check the current source and tests for build behavior.

## Executive Summary & Core Mission

The **PTE Academic 90-Mastery Platform** is a local, full-length PTE Academic Exam Simulator and Granular Diagnostic Analytics System. Its sole purpose is to systematically identify candidate weaknesses, log every mistake and correction, and guide candidates step-by-step toward achieving a **PTE Score of 90 (Superior English / C2 Level)** across all four communicative skills: **Speaking, Writing, Reading, and Listening**.

---

## What We Are Building & Achieving

### 1. Authentic PTE Academic Test Environment
- **Official Exam Format**: The real Pearson PTE Academic runs **~2 hours, max 2 h 15 min** (Part 1: Speaking & Writing **76–84 min**, Part 2: Reading **23–30 min**, Part 3: Listening **31–39 min** — official bands; per-part maxima deliberately don't sum to the total). ⚠️ **Known build deviation:** the simulator still uses a flat **120-min** clock and the *old* 54–67 / 29–30 / 30–43 bands (`pte-exam.md` §11 **D9**).
- **Exact Item UI & Timers**: Item-by-item timers, beep audio cues before speech recording, live waveform audio visualizers, and dual-editor word counters.
- **Web Audio Engine**: Captures high-fidelity browser microphone audio output (`.webm`/`.wav`) and renders real-time frequency spectrums on HTML5 Canvas.

### 2. High-Frequency Real PTE Content Bank
- Sourced from authentic PTE Academic exam patterns and academic datasets covering:
  - **Speaking**: Read Aloud (RA), Repeat Sentence (RS), Describe Image (DI), Re-tell Lecture (RL), Answer Short Question (ASQ).
  - **Writing**: Summarize Written Text (SWT), Write Essay (WE).
  - **Reading**: Reading & Writing Fill in the Blanks (R&W FIB), Re-order Paragraphs (RO), Reading Fill in the Blanks (R FIB), Multiple Choice (MCMA/MCSA).
  - **Listening**: Summarize Spoken Text (SST), Write from Dictation (WFD), Listening Fill in the Blanks (L FIB), Highlight Correct Summary (HCS), Multiple Choice (MCMA/MCSA), Select Missing Word *(currently mis-named "Highlight Missing Words" — `pte-exam.md` §11 D6)*.
  - **Not yet in the bank** (official types still missing, `pte-exam.md` §11 D1/D2): **Summarize Group Discussion**, **Respond to a Situation**, **Highlight Incorrect Words**, plus the unscored **Personal Introduction**. The build covers **19 of the 22 official scored types**.

### 3. Granular Error & Correction Log (The "Path to 90" Engine)
To reach a PTE score of 90, zero-defect execution is required in Enabling Skills. Our database and evaluation engine track:
- **Exact Mistake Extraction**: Identifies specific grammar errors, misspellings, run-on sentences, missing keywords, and speech fluency stumbles.
- **Model Correction Mapping**: Stores the exact model answer or corrected sentence structure side-by-side with the candidate's response.
- **Enabling Skills Breakdown**:
  - **Grammar**: Sentence structure correctness, subject-verb agreement, tenses.
  - **Spelling**: Precise character-level spelling accuracy (critical for Summarize Text, Essay, & Write from Dictation).
  - **Vocabulary**: Academic Word List (AWL) usage, collocation accuracy, and lexical diversity (Type-Token Ratio).
  - **Oral Fluency & Pronunciation**: Speech rate, rhythm, hesitation markers, and pause frequency.
  - **Written Discourse**: Cohesive devices (*furthermore, consequently, on the other hand*) and paragraph flow.

### 4. Dual-Layer AI Evaluation Pipeline
- **Layer 1 (Instant Local Evaluation)**: Real-time automated scoring when a candidate submits an attempt, providing immediate numerical scores (10–90 scale) and automated error flags.
- **Layer 2 (Deep AI Examiner Agent Review)**: When the user says `new test completed` in chat, the AI agent inspects the SQLite database, analyzes recorded audio files & essays, provides line-by-line feedback, updates the score, and logs recommendations in the candidate's diagnostic vault.

---

## Database Schema & Analytics Engine

The platform is backed by a local SQLite database (`database/practice.db`) structured as follows:

```
practice.db
├── tests (ID, Title, Exam Type, Total Time — build: flat 120m; official: 76–84/23–30/31–39, max 2h15, pte-exam.md D9)
├── questions (ID, Test ID, Module, Type, Prompt, Passage, Media URL, Options, Answer Key)
├── test_attempts (ID, Test ID, Student Name, Started At, Completed At, Overall Score, Listening, Reading, Writing, Speaking)
├── user_responses (ID, Attempt ID, Question ID, Text Response, Audio File Path, Transcript, Score, Feedback)
└── mistake_logs (ID, Attempt ID, Question ID, Category, Candidate Output, Model Correction, Score Impact, Status)
```

---

## Score-to-90 Progression Strategy

| Communicative Skill | Target Score | Key Focus for 90 |
| :--- | :---: | :--- |
| **Speaking** | **90** | Smooth oral fluency without self-corrections or hesitations; clear pronunciation; complete content coverage in Read Aloud & Describe Image. |
| **Writing** | **90** | Flawless grammar and spelling; strict adherence to word count rules (200-300 words for Essay; 5-75 words in ONE sentence for Summarize Text); rich academic vocabulary. |
| **Reading** | **90** | Collocation awareness in Fill in the Blanks; logical sequencing in Re-order Paragraphs. |
| **Listening** | **90** | 100% spelling and punctuation accuracy in Write from Dictation (WFD) and Summarize Spoken Text (SST). |

---

## Summary of Workflow

1. **Take Full PTE Mock Test**: Run `npm start` (or `PORT=3999 npm start`), navigate to `http://localhost:3000` (or your `PORT`), and complete the full mock test.
2. **View Instant Diagnostics & Mistake Vault**: Inspect your attempt report to see your overall PTE score (10–90) and review every flagged mistake and recommended correction.
3. **Trigger AI Examiner Review**: Type `new test completed` in chat to have the AI agent perform a deep line-by-line review of your audio and essays.
4. **Iterate & Improve**: Re-take weak item types from the Attempt Vault until your enabling skills consistently achieve 90 marks!
