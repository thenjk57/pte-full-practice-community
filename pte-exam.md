# PTE Academic — Canonical Exam Reference

> **Purpose:** This file is the **authoritative single source of truth about the real Pearson Test of English Academic (PTE Academic) exam**.
> AI agents and developers working on this project must validate any website feature, test-engine logic, timer architecture, scoring rubric, and UI component against this document.
> If the practice website or older project documentation disagrees with this file, **this file wins** (unless explicitly marked as a known intentional simulation approximation).
>
> **Scope:** PTE Academic (and its identical twin PTE Academic UKVI). It does **not** cover PTE Core or PTE Home — see §10.
>
> **Current Format (Updated 2025–2026):** Reflects the current Pearson exam format comprising **22 scored question types** (+1 unscored Personal Introduction), including the permanent additions introduced in August 2025: *Summarize Group Discussion* and *Respond to a Situation*. Older project documents (`PTE_FULL_MOCK_TEST.md`, `PTE_MASTERY_PLATFORM.md`) partially reflect the older 20-type format — see §11.

---

## 1. At a Glance

| Property | Value |
|---|---|
| **Test name** | Pearson Test of English Academic (PTE Academic) |
| **Administrator** | Pearson plc (computer-delivered exclusively at authorized Pearson VUE test centers) |
| **Skills tested** | 4 Communicative Skills: **Speaking, Writing, Reading, Listening** |
| **Delivery** | Single continuous computer session: QWERTY keyboard, monitor, over-ear headset with boom microphone |
| **Total duration** | **~2 hours; maximum 2 hours 15 minutes** (officially balanced per test form) |
| **Structure** | **3 sequential parts:** Part 1 Speaking & Writing → Part 2 Reading → Part 3 Listening |
| **Question types** | **22 scored types** (+ 1 unscored Personal Introduction = 23 total tasks) |
| **Items per test** | **65–75 questions** in total |
| **Score scale** | **10–90** on the Global Scale of English (GSE), aligned to CEFR (10 is scale floor, 90 is maximum) |
| **Overall score** | **Not an arithmetic average** of the four communicative skills (weighted psychometric composite) |
| **Scoring engine** | Automated AI scoring (Versant speech processing + Intelligent Essay Assessor/LSA) with expert human verification on select open-ended tasks (§6.5) |
| **Results turnaround**| Typically within 48 hours; up to 5 business days |
| **Score validity** | 2 years from test date |
| **Breaks** | **No scheduled breaks** (an unscheduled bathroom break is permitted, but the test clock continues running) |
| **Retakes** | Bookable as soon as scores for the previous attempt are received; test takers may sit more than once a month |
| **Acceptance** | 4,000+ universities worldwide; 100% accepted for Australian & NZ student/skilled migration visas; UK SELT (via PTE Academic UKVI) |

### 1.1 The Integrated-Skills Principle
PTE Academic evaluates real-world academic English through **integrated-skills items**. More than half of the item types contribute points to **two communicative skills simultaneously**:
- E.g., **Read Aloud** feeds **Reading** (comprehension and lexical decoding) **and** **Speaking** (fluency and pronunciation).
- E.g., **Write from Dictation** feeds **Listening** (auditory retention) **and** **Writing** (accurate spelling and transcription).

Every point earned on an integrated task contributes directly to **both** relevant communicative skill scores as well as the Overall score.

---

## 2. Test Structure & Section Breakdown

| Part | Name | Official Duration | Question Types | Skills Evaluated | Timer Type |
|---|---|---|---|---|---|
| **Part 1** | **Speaking & Writing** | **approx. 76–84 min** | 9 scored (+ 1 unscored intro) | Speaking, Writing, Reading, Listening | **Per-item timers** (prep + response timers for speaking; 10m/20m for written tasks) |
| **Part 2** | **Reading** | **approx. 23–30 min** | 5 scored | Reading, Writing | **Single pooled countdown timer** for the entire section (no per-item timers) |
| **Part 3** | **Listening** | **approx. 31–39 min** | 8 scored | Listening, Writing, Reading | **Hybrid:** SST has its own independent 10 min timer; remaining 7 types share a single pooled countdown (21–29 min) |

> **Official Pearson Timing Caveat (Score Guide §7, Note 1):**
> *"The minimum and maximum timings indicated for the sections of each part of the test do not add up to the total timings stated. This is because different versions of the test are balanced for total length. No test taker will get the maximum or minimum times indicated."*

### Key Test-Flow Rules
1. **Unidirectional progression:** Test takers **cannot navigate back** to review or alter previous responses once the "Next" button is clicked (§8).
2. **Audio single-play:** All listening stimulus audio clips play **automatically and exactly once**; replay is disabled.
3. **Transition screens:** Interstitial screens appear between major sections ("End of Part 1 — Begin Part 2", etc.). In practice simulators, this is an essential transition point.

---

### 2.1 Complete Master Table of Question Types

| # | Question Type | Part | Question Count | Scoring Type | Max Raw Points / Item | Communicative Skills Fed |
|---|---|---|---|---|---|---|
| — | *Personal Introduction* | 1 | 1 | *Unscored* | 0 | *None (familiarization only)* |
| 1 | **Read Aloud** | 1 | 6–7 | Partial credit | 13 | **Reading and Speaking** |
| 2 | **Repeat Sentence** | 1 | 10–12 | Partial credit | 13 | **Listening and Speaking** |
| 3 | **Describe Image** | 1 | 5–6 | Partial credit | 15 | **Speaking** |
| 4 | **Re-tell Lecture** | 1 | 2–3 | Partial credit | 15 | **Listening and Speaking** |
| 5 | **Answer Short Question** | 1 | 5–6 | Correct / Incorrect | 1 | **Listening** *(Speaking is response medium, not scored)* |
| 6 | **Summarize Group Discussion** | 1 | 2–3 | Partial credit | 15 | **Listening and Speaking** |
| 7 | **Respond to a Situation** | 1 | 2–3 | Partial credit | 15 | **Speaking** |
| 8 | **Summarize Written Text** | 1 | 1–2 | Partial credit | 7 | **Reading and Writing** |
| 9 | **Write Essay** | 1 | 1–2 | Partial credit | 15 | **Writing** |
| 10 | **Reading & Writing: Fill in the Blanks** *(Dropdown)* | 2 | 5–6 | Partial credit (per blank) | 4–6 | **Reading and Writing** |
| 11 | **Multiple Choice, Multiple Answers** | 2 | 1–2 | Partial credit with penalty | Varies (opts) | **Reading** |
| 12 | **Re-order Paragraphs** | 2 | 2–3 | Partial credit (adjacent pairs) | $N - 1$ | **Reading** |
| 13 | **Reading: Fill in the Blanks** *(Drag and Drop)* | 2 | 4–5 | Partial credit (per blank) | 3–5 | **Reading** |
| 14 | **Multiple Choice, Single Answer** | 2 | 1–2 | Correct / Incorrect | 1 | **Reading** |
| 15 | **Summarize Spoken Text** | 3 | 1–2 | Partial credit | 10 | **Listening and Writing** |
| 16 | **Multiple Choice, Multiple Answers** | 3 | 1–2 | Partial credit with penalty | Varies (opts) | **Listening** |
| 17 | **Fill in the Blanks** *(Listening Type In)* | 3 | 2–3 | Partial credit (per blank) | 2–3 | **Listening and Writing** |
| 18 | **Highlight Correct Summary** | 3 | 1–2 | Correct / Incorrect | 1 | **Listening and Reading** |
| 19 | **Multiple Choice, Single Answer** | 3 | 1–2 | Correct / Incorrect | 1 | **Listening** |
| 20 | **Select Missing Word** | 3 | 1–2 | Correct / Incorrect | 1 | **Listening** |
| 21 | **Highlight Incorrect Words** | 3 | 2–3 | Partial credit with penalty | Varies (errs) | **Listening and Reading** |
| 22 | **Write from Dictation** | 3 | 3–4 | Partial credit (per word) | 8–15 | **Listening and Writing** |

> **Note on Question Counts:** The ranges represent different randomized forms. Total item count always lands strictly within **65–75 questions**.

---

### 2.2 Cross-Skill Contribution Matrix
For developers building a practice platform scoring engine, this matrix shows which tasks contribute to each communicative skill:

```
┌───────────────────────────────┬─────────┬─────────┬─────────┬─────────┐
│ Question Type                 │ Speak   │ Write   │ Read    │ Listen  │
├───────────────────────────────┼─────────┼─────────┼─────────┼─────────┤
│ Read Aloud                    │    ●    │         │    ●    │         │
│ Repeat Sentence               │    ●    │         │         │    ●    │
│ Describe Image                │    ●    │         │         │         │
│ Re-tell Lecture               │    ●    │         │         │    ●    │
│ Answer Short Question         │         │         │         │    ●    │
│ Summarize Group Discussion    │    ●    │         │         │    ●    │
│ Respond to a Situation        │    ●    │         │         │         │
│ Summarize Written Text        │         │    ●    │    ●    │         │
│ Write Essay                   │         │    ●    │         │         │
│ R&W: Fill in Blanks (Dropdown)│         │    ●    │    ●    │         │
│ Reading: MC, Multiple Answers │         │         │    ●    │         │
│ Re-order Paragraphs           │         │         │    ●    │         │
│ Reading: Fill in Blanks (D&D) │         │         │    ●    │         │
│ Reading: MC, Single Answer    │         │         │    ●    │         │
│ Summarize Spoken Text         │         │    ●    │         │    ●    │
│ Listening: MC, Multiple Ans   │         │         │         │    ●    │
│ Listening: FIB (Type In)      │         │    ●    │         │    ●    │
│ Highlight Correct Summary     │         │         │    ●    │    ●    │
│ Listening: MC, Single Answer  │         │         │         │    ●    │
│ Select Missing Word           │         │         │         │    ●    │
│ Highlight Incorrect Words     │         │         │    ●    │    ●    │
│ Write from Dictation          │         │    ●    │         │    ●    │
└───────────────────────────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## 3. Part 1 — Speaking & Writing (76–84 min)

### Global Speaking Rules (Apply to all speaking items)
- **Countdown & Tone:** The recording status box displays a preparation countdown. When prep expires, a **short tone (beep)** sounds and the microphone opens.
  *(Exception: **Answer Short Question** has **no tone** — the mic opens immediately when audio ends).*
- **Do not speak early:** Speaking before the microphone status changes to "Recording" results in lost speech and a zero/reduced score.
- **Single Attempt:** Each response can only be recorded once. No re-record, no audio replay.
- **3-Second Silence Auto-cutoff:** If silence or a pause lasts for **3 consecutive seconds** after recording begins, the microphone automatically closes, status switches to "Completed", and the candidate must click "Next".
- **Volume & Microphone Placement:** Speak at a natural conversational volume. Keep the boom microphone ~2 finger-widths from the corner of the mouth to avoid popping/breathing sounds.

---

### 3.0 Personal Introduction (UNSCORED)
- **Format:** Prompt on screen asking the candidate to introduce themselves (interests, study plans, etc.).
- **Timing:** **25 seconds** preparation → **30 seconds** recording.
- **Scoring:** **Unscored (0 points).** Sent along with the score report to institutions for identity verification and familiarization.

---

### 3.1 Read Aloud (RA)
- **Task:** Read a short text aloud exactly as printed.
- **Prompt Length:** Up to **60 words**.
- **Preparation Time:** **30–40 seconds** (proportional to text length).
- **Recording Time:** Up to **40 seconds** (auto-ends if silence >3s).
- **Skills Fed:** **Reading and Speaking**.
- **Scoring (Max 13 points):**
  - **Content (0–3):** Measures accuracy of words pronounced in sequence.
    - $3 =$ All words read correctly in sequence.
    - Each omitted word, substituted word, or inserted word counts as 1 error.
    - If Content = 0, **Pronunciation and Fluency are zeroed** (§6.4).
  - **Oral Fluency (0–5):** Smooth, continuous rhythm without hesitation, false starts, or unnatural pauses.
  - **Pronunciation (0–5):** Production of vowels, consonants, and word stress intelligible to regular English speakers.

---

### 3.2 Repeat Sentence (RS)
- **Task:** Listen to a sentence played once through the headset; repeat it back verbatim.
- **Prompt Length:** Audio **3–9 seconds** (approx. 8–16 words), heard **once**.
- **Response Time:** **15 seconds** (mic opens after audio finishes + short tone).
- **Skills Fed:** **Listening and Speaking**.
- **Scoring (Max 13 points):**
  - **Content (0–3):** Correct words in exact sequence:
    - **3 points:** 100% of words reproduced in correct sequence.
    - **2 points:** At least 50% of words in correct sequence.
    - **1 point:** Less than 50% of words in correct sequence.
    - **0 points:** Almost no words recognized or off-topic.
    - *(Note: Hesitations and pauses do not reduce Content; they reduce Oral Fluency).*
  - **Oral Fluency (0–5)**
  - **Pronunciation (0–5)**
  - **Trait dependency:** If Content = 0, Pronunciation and Fluency = 0.

---

### 3.3 Describe Image (DI)
- **Task:** View an image (bar graph, line chart, pie chart, map, diagram, or process) and speak a detailed description.
- **Preparation Time:** **25 seconds** to study the visual.
- **Recording Time:** **40 seconds**.
- **Skills Fed:** **Speaking**.
- **Scoring (Max 15 points):**
  - **Content (0–5):**
    - **5:** Describes all elements, highlights key data points, relationships, and draws a valid conclusion/implication.
    - **4:** Describes all key features and relationships with conclusion.
    - **3:** Deals with most key features and mentions conclusion.
    - **2:** Describes only one key feature or shows limited comprehension.
    - **1:** Disconnected points or basic description.
    - **0:** Irrelevant response, silence, or **pre-memorized generic template with no specific image data**.
  - **Oral Fluency (0–5)**
  - **Pronunciation (0–5)**
  - **Human Verification:** Content is evaluated by AI and reviewed by human experts (§6.5). If Content = 0, whole item = 0.

---

### 3.4 Re-tell Lecture (RL)
- **Task:** Listen to (and optionally view a presenter slide/video) an academic lecture; retell the key points in your own words.
- **Prompt:** Audio/video **up to 90 seconds**, heard **once**; erasable whiteboard notes allowed.
- **Preparation Time:** **10 seconds**.
- **Recording Time:** **40 seconds**.
- **Skills Fed:** **Listening and Speaking**.
- **Scoring (Max 15 points):**
  - **Content (0–5):** Captures main ideas, major supporting details, relationships between concepts, and conclusion. (Paraphrasing is rewarded; verbatim disjointed keyword lists score lower).
  - **Oral Fluency (0–5)**
  - **Pronunciation (0–5)**
  - **Zero condition:** If Content = 0, Fluency and Pronunciation receive 0.

---

### 3.5 Answer Short Question (ASQ)
- **Task:** Hear a short general knowledge or vocabulary question; answer with a single word or brief phrase.
- **Prompt:** Audio **3–9 seconds**, heard **once** (sometimes with an accompanying still image).
- **Preparation Time:** None. **No tone** — microphone opens immediately when audio terminates.
- **Recording Time:** **10 seconds** (auto-cutoff after 3s of silence).
- **Skills Fed:** **Listening only**. *(Speaking is the communication medium, but pronunciation and oral fluency are not scored).*
- **Scoring (Max 1 point):**
  - **1 point:** Correct word or acceptable listed synonym.
  - **0 points:** Incorrect word or no response.
  - No penalty for providing a minor filler (e.g., "a thermometer" vs "thermometer").

---

### 3.6 Summarize Group Discussion (SGD) *(Added August 2025)*
- **Task:** Listen to a recorded discussion among **three distinct speakers** debating an academic or professional topic; provide a spoken summary synthesizing the key viewpoints and final outcome.
- **Prompt:** Audio **2.5 to 3 minutes**, heard **once**; erasable whiteboard note-taking permitted.
- **Preparation Time:** **10 seconds**.
- **Recording Time:** **2 minutes (120 seconds)**.
- **Skills Fed:** **Listening and Speaking**.
- **Scoring (Max 15 points):**
  - **Content (0–5):** Must identify the core discussion topic, summarize the distinct perspectives of all 3 speakers, note areas of consensus/disagreement, and state the final decision or conclusion.
  - **Oral Fluency (0–5)**
  - **Pronunciation (0–5)**
  - **Human Verification:** AI-scored with expert human review on Content.
  - **Zero condition:** If Content = 0, Fluency and Pronunciation = 0.

---

### 3.7 Respond to a Situation (RTS) *(Added August 2025)*
- **Task:** Read and listen to a description of an everyday academic, social, or workplace situation; provide an extended spoken response speaking directly as yourself in that scenario.
- **Prompt:** On-screen text (up to **60 words**) plus audio recording, heard **once**.
- **Preparation Time:** **10–20 seconds** (standard test form provides 10s).
- **Recording Time:** **40 seconds**.
- **Skills Fed:** **Speaking**.
- **Scoring (Max 15 points):**
  - **Content (0–5):** Appropriateness of register (politeness, academic vs professional), addressing all situational requirements, achieving the communication goal (e.g., requesting an extension, solving a customer dispute).
  - **Oral Fluency (0–5)**
  - **Pronunciation (0–5)**
  - **Human Verification:** AI-scored with expert human review on Content.

---

### 3.8 Summarize Written Text (SWT)
- **Task:** Read a passage and write a summary in **exactly one single sentence**.
- **Prompt:** Text up to **300 words**.
- **Time Allocated:** **10 minutes per item** (independent countdown timer).
- **Skills Fed:** **Reading and Writing**.
- **Length Constraint:** Must be between **5 and 75 words** in **one single complete sentence** ending with a single full stop.
- **UI Tools:** Cut, Copy, Paste buttons, and a live word counter are provided on screen.
- **Scoring Rubric (Max 7 points):**
  - **Content (0–2):**
    - **2:** Good summary covering all major aspects without misrepresenting the passage.
    - **1:** Fair summary missing one or two points.
    - **0:** Omits or misrepresents the topic/purpose (**triggers total item score = 0**).
  - **Form (0–1):**
    - **1:** Exactly 1 sentence, between 5 and 75 words.
    - **0:** Multiple sentences, <5 words, >75 words, or ALL CAPS (**triggers total item score = 0**).
  - **Grammar (0–2):** 2 = correct grammatical structure; 1 = minor errors not impeding meaning; 0 = defective structure.
  - **Vocabulary (0–2):** 2 = appropriate lexical choice; 1 = minor errors; 0 = defective choice.
  - **Critical Zero Rules:** If **Content = 0** OR **Form = 0**, the candidate receives **0 for the entire question**.

---

### 3.9 Write Essay (WE)
- **Task:** Write an argumentative or discursive essay responding to a 2–3 sentence prompt.
- **Time Allocated:** **20 minutes per item** (independent countdown timer).
- **Skills Fed:** **Writing**.
- **Length Constraint:** **200–300 words**.
- **UI Tools:** Cut, Copy, Paste buttons, live word count display.
- **Scoring Rubric (Max 15 points across 7 factors):**
  - **Content (0–3):**
    - **3:** Thoroughly addresses the prompt, provides logical reasoning and relevant examples.
    - **2:** Deals with the prompt adequately but omits minor aspects.
    - **1:** Superficial discussion.
    - **0:** Off-topic, completely irrelevant, or unoriginal/memorized response (**triggers total essay score = 0**).
  - **Form (0–2):**
    - **2:** 200–300 words.
    - **1:** 120–199 words OR 301–380 words.
    - **0:** <120 words OR >380 words, or written in bullet points / ALL CAPS (**triggers total essay score = 0**).
  - **Development, Structure & Coherence (DSC) (0–2):** 2 = clear intro, body, conclusion, logical transitions; 1 = basic structure; 0 = poor organization.
  - **Grammar Usage & Mechanics (0–2):** 2 = high degree of grammatical accuracy; 1 = some minor errors; 0 = severe errors.
  - **General Linguistic Range (GLR) (0–2):** 2 = wide vocabulary and complex sentence structures; 1 = adequate range; 0 = basic.
  - **Vocabulary Range (0–2):** 2 = academic vocabulary and idiomatic precision; 1 = acceptable; 0 = insufficient.
  - **Spelling (0–2):** 2 = correct spelling; 1 = one spelling error; 0 = more than one spelling error.
- **Spelling Consistency:** US, UK, Australian, and Canadian conventions are all accepted; however, **one convention must be used consistently** throughout the response.
- **Human Review:** Content, DSC, and GLR undergo expert human review before finalization.

---

## 4. Part 2 — Reading (23–30 min)

### Section Timing Invariant (Crucial for Simulators)
- **No Per-Item Timers:** All 5 question types run under a **single pooled countdown timer** (approx. 23–30 minutes for the whole part).
- Candidates must manage their own time across the section (recommended ~1.5 to 2 minutes per question). Any simulator imposing a per-item timer on Reading questions violates official PTE test behavior.

---

### 4.1 Reading & Writing: Fill in the Blanks (Dropdown)
- **Alias:** Often called *"Fill in the Blanks (Dropdown)"*.
- **Task:** Read a text of up to **300 words** containing 4–6 missing word blanks; select the correct word for each blank from an inline **drop-down menu**.
- **Skills Fed:** **Reading and Writing** *(tests contextual vocabulary, collocations, prepositions, and grammatical inflections)*.
- **Scoring:** **Partial credit: 1 point per correctly selected blank.** (0 = minimum).

---

### 4.2 Multiple Choice, Multiple Answers (Reading)
- **Task:** Read an academic text of up to **350 words**; select all applicable answers from 5–7 options.
- **Skills Fed:** **Reading**.
- **Scoring:** **Partial credit with penalty:**
  - **+1 point** for each correct option selected.
  - **−1 point** for each incorrect option selected.
  - **Floor at 0:** Total score for the item cannot be negative (minimum = 0).
  - *(Note: One of only three negative-marking item types in the entire exam).*

---

### 4.3 Re-order Paragraphs
- **Task:** 4–5 sentences/text boxes (totaling up to **150 words**) appear in jumbled order. Restore the correct chronological/logical sequence by dragging or using up/down arrow buttons.
- **Skills Fed:** **Reading**.
- **Scoring (Adjacent Pairs):**
  - **+1 point for each correctly ordered adjacent pair.**
  - If the correct order is `A - B - C - D`, the 3 target adjacent pairs are `[A-B]`, `[B-C]`, `[C-D]`.
  - For $N$ paragraphs, the maximum score is $N - 1$ points.
  - Example: A candidate who answers `B - C - D - A` earns 2 points (for `[B-C]` and `[C-D]`).

---

### 4.4 Reading: Fill in the Blanks (Drag and Drop)
- **Task:** Read a passage of up to **80 words** containing 3–5 gaps; drag words from a word bank at the bottom into the appropriate blanks.
- **Word Bank:** Contains **more words than gaps** (distractors).
- **Skills Fed:** **Reading only**.
- **Scoring:** **Partial credit: 1 point per correct blank.** (Floor = 0).

---

### 4.5 Multiple Choice, Single Answer (Reading)
- **Task:** Read a text of up to **300 words**; answer a multiple-choice question by selecting **one** correct option among 4 choices.
- **Skills Fed:** **Reading**.
- **Scoring:** **Correct / Incorrect: 1 point if correct, 0 points if incorrect.**

---

## 5. Part 3 — Listening (31–39 min)

### Global Listening Rules
- All audio clips play **automatically** and are heard **exactly once** (replay is impossible).
- Note-taking on the erasable whiteboard is permitted during playback.
- **Timer Mechanics:**
  - **Summarize Spoken Text (SST)** has its own dedicated **10-minute timer per question** (independent of the section clock).
  - The remaining 7 listening question types share a **single pooled countdown timer** (approx. 21–29 minutes total).

---

### 5.1 Summarize Spoken Text (SST)
- **Task:** Listen to a short lecture; write a summary of **50–70 words**.
- **Prompt:** Audio **60–90 seconds**, heard **once**.
- **Time Allocated:** **10 minutes per item** (listening + writing).
- **Skills Fed:** **Listening and Writing**.
- **Length Constraint:** **50–70 words**.
- **UI Tools:** Cut, Copy, Paste, and live word counter.
- **Scoring Rubric (Max 10 points across 5 factors):**
  - **Content (0–2):** 2 = covers all key points; 1 = fair summary; 0 = off-topic / misinterprets topic (**triggers total item score = 0**).
  - **Form (0–2):**
    - **2:** 50–70 words.
    - **1:** 40–49 words OR 71–100 words.
    - **0:** <40 words OR >100 words, or written in ALL CAPS / bullets (**triggers total item score = 0**).
  - **Grammar (0–2):** 2 = correct; 1 = minor errors; 0 = defective.
  - **Vocabulary (0–2):** 2 = appropriate; 1 = minor errors; 0 = defective.
  - **Spelling (0–2):** 2 = correct spelling; 1 = one spelling error; 0 = more than one spelling error.
- **Human Verification:** AI-scored with human expert review on Content.

---

### 5.2 Multiple Choice, Multiple Answers (Listening)
- **Task:** Listen to an audio clip of **80–120 seconds**; select all correct options among 5–7 choices.
- **Preview Time:** ~7 seconds before audio starts.
- **Skills Fed:** **Listening**.
- **Scoring:** **Partial credit with penalty: +1 correct, −1 incorrect, floor at 0.**

---

### 5.3 Fill in the Blanks (Listening Type In)
- **Task:** A transcript with 2–3 missing words is displayed; listen to audio (**30–60 seconds**) and type the missing words into the input fields.
- **Preview Time:** ~7 seconds before audio starts.
- **Skills Fed:** **Listening and Writing** *(decoding audio into words feeds Listening; typing with accurate spelling feeds Writing)*.
- **Scoring:** **Partial credit: 1 point per correctly spelled missing word.**

---

### 5.4 Highlight Correct Summary (HCS)
- **Task:** Listen to an audio clip of **30–90 seconds**; select the one paragraph summary that best reflects the audio.
- **Preview Time:** ~10 seconds before audio starts.
- **Skills Fed:** **Listening and Reading**.
- **Scoring:** **Correct / Incorrect: 1 point if correct, 0 points if incorrect.**

---

### 5.5 Multiple Choice, Single Answer (Listening)
- **Task:** Listen to an audio clip of **30–90 seconds**; select the single correct answer from 4 options.
- **Preview Time:** ~5 seconds before audio starts.
- **Skills Fed:** **Listening**.
- **Scoring:** **Correct / Incorrect: 1 point if correct, 0 points if incorrect.**

---

### 5.6 Select Missing Word (SMW)
- **Task:** Listen to a recording of **20–70 seconds**. The final word or phrase is muted and replaced by a **beep**. Select the correct completion from 3–5 options.
- **Preview Time:** ~7 seconds before audio starts.
- **Skills Fed:** **Listening**.
- **Scoring:** **Correct / Incorrect: 1 point if correct, 0 points if incorrect.**

---

### 5.7 Highlight Incorrect Words (HIW)
- **Task:** A transcript appears on screen containing deliberate errors. As the audio plays (**15–50 seconds**), click on the words in the transcript that differ from what the speaker actually says.
- **Preview Time:** ~10 seconds before audio starts.
- **Skills Fed:** **Listening and Reading**.
- **Scoring:** **Partial credit with penalty:**
  - **+1 point** for each correctly identified incorrect word.
  - **−1 point** for each correctly spoken word that was mistakenly clicked.
  - **Floor at 0:** Total item score cannot be negative.
  - *(The third of three negative-marking item types in the test).*

---

### 5.8 Write from Dictation (WFD)
- **Task:** Hear a short sentence (**3–5 seconds**, 8–15 words); type it accurately into the text box.
- **Skills Fed:** **Listening and Writing**.
- **Scoring:** **Partial credit: 1 point per correct word spelled correctly.**
  - **Scoring Engine Mechanics:** Evaluated using a word-presence / bag-of-words match against the target sentence.
  - **No negative penalty:** Extra words do not deduct points.
  - **Word order:** While candidates are taught standard sentence order, the core scoring engine awards points for each correctly identified and spelled target word.

---

## 6. Official Scoring Model & Rules

### 6.1 The 10–90 Scale
- All reported scores (Overall and each Communicative Skill) are mapped onto the **10–90 Global Scale of English (GSE)**.
- **The Overall Score is NOT an arithmetic average** of the 4 communicative skills. It is computed from a comprehensive psychometric measurement model across all items.
- A completely blank test paper yields a score of **10** (the official floor), never 0.

### 6.2 Scoring Modes
1. **Correct / Incorrect:** 1 point for correct, 0 for incorrect. Used on: Answer Short Question, Reading MCQ-Single, Highlight Correct Summary, Listening MCQ-Single, Select Missing Word.
2. **Partial Credit:** Points awarded on a multi-trait rubric (Content, Form, Fluency, Pronunciation, Grammar, Vocabulary, Spelling). Used on all other 17 question types.

### 6.3 Negative Marking (Exactly Three Question Types)
Only three item types in the entire exam deduct points for wrong selections:
1. Reading — Multiple Choice, Multiple Answers
2. Listening — Multiple Choice, Multiple Answers
3. Listening — Highlight Incorrect Words
**Rule:** `+1` per correct hit, `−1` per false positive, with a **hard floor at 0** per question.

### 6.4 Hard Zero-Score Triggers
| Task Type | Zero Condition (Whole Item = 0) |
|---|---|
| **All Speaking Tasks** (RA, RS, DI, RL, SGD, RTS) | **Content = 0** (silence, off-topic, or unoriginal/memorized template) **⇒ Fluency and Pronunciation are locked to 0**. |
| **Summarize Written Text** | **Content = 0** (misinterpreted topic) OR **Form = 0** (<5 words, >75 words, multiple sentences, ALL CAPS). |
| **Write Essay** | **Content = 0** (off-topic / memorized template) OR **Form = 0** (<120 words or >380 words, bullet points, ALL CAPS). |
| **Summarize Spoken Text** | **Content = 0** (misinterpreted lecture topic) OR **Form = 0** (<40 words or >100 words, ALL CAPS). |

### 6.5 AI + Human Expert Scoring Verification
- All responses are initially scored by Pearson's proprietary automated engine.
- To prevent AI gaming and template exploitation, **human expert raters review the Content trait** before scores are finalized for:
  - Describe Image
  - Re-tell Lecture
  - Respond to a Situation
  - Summarize Group Discussion
  - Summarize Written Text
  - Write Essay *(also reviews DSC and GLR)*
  - Summarize Spoken Text
- If AI scoring and the human rater disagree, a **second human expert** adjudicates the final grade.

---

## 7. Score Reporting, Skills Profile & Concordance

### 7.1 What the Score Report Contains
1. **Overall Score:** 10–90 GSE.
2. **Four Communicative Skills:** Listening, Reading, Speaking, Writing (10–90 each).
3. **Skills Profile (8 Diagnostic Areas):**
   - *Open response speaking and writing*
   - *Reproducing spoken and written language*
   - *Extended writing*
   - *Short writing*
   - *Extended speaking*
   - *Short speaking*
   - *Multiple-skills comprehension*
   - *Single-skill comprehension*
4. **Personalized Recommendations:** GSE learning objectives outlining specific areas for improvement.
5. **Score Report Code (SRC):** A 10-digit secure identifier for digital institutional verification.

*(Note: Prior to 2021, Pearson reported six "Enabling Skills": Grammar, Oral Fluency, Pronunciation, Spelling, Vocabulary, Written Discourse. These are no longer printed as standalone numerical scores on the candidate report, but are retained internally by Pearson's scoring engine).*

### 7.2 Concordance Table: PTE Academic vs IELTS vs CEFR
*(Based on Pearson's July 2025 research alignment)*

| PTE Academic Overall | IELTS Academic Band | CEFR Level | Typical Institutional Use |
|:---:|:---:|:---:|---|
| **86–90** | **8.5–9.0** | **C2** | Advanced professional licenses / Master of Laws / Medicine |
| **76–85** | **7.5–8.0** | **C1** | Top-tier postgraduate degrees / Australian 8-band points |
| **66–75** | **7.0** | **B2–C1** | General postgraduate / competitive undergraduate / Nursing registration |
| **58–65** | **6.5** | **B2** | Standard undergraduate admission / Australian visa competent level |
| **50–57** | **6.0** | **B2** | Undergraduate entry / Vocational diplomas |
| **42–49** | **5.5** | **B1** | Foundation pathways / vocational training |
| **36–41** | **5.0** | **B1** | English for Academic Purposes (EAP) preparation |
| **29–35** | **4.5** | **A2** | Pre-sessional English courses |
| **10–28** | **≤ 4.0** | **< A2** | Below threshold |

---

## 8. Exam-Room Rules & Simulator Technical Invariants

When implementing a practice simulator, the following real-test behaviors **must** be enforced:

1. **Unidirectional UI:** No "Back" or "Previous" button. Advancing to the next question permanently commits the current answer.
2. **Audio Lockdown:** No native `<audio>` controls (no play/pause button, scrub bar, or replay ability). Audio starts automatically and can only play once.
3. **Single Recording Attempt:** No re-recording or audio review for speaking tasks.
4. **Silence Cutoff:** Continuous monitoring of microphone audio; after 3 seconds of continuous silence during recording, the recorder automatically stops and sets status to "Completed".
5. **Continuous Pooled Timers:** Reading (23–30 min) and non-SST Listening (21–29 min) must run on a continuous global clock that does not reset on question change.
6. **Auto-Advance on Timer Expiry:** When per-item timers (SWT 10m, Essay 20m, SST 10m) reach 00:00, the system must immediately submit the text and advance to the next item.
7. **Word Counter & Editing Tools:** SWT, Essay, and SST must feature a live word counter and Cut/Copy/Paste action buttons.
8. **Erasable Whiteboard Emulation:** In real tests, candidates receive an erasable notepad and marker. Note-taking is allowed during audio playback for SST, RL, SGD, RTS, and WFD.

---

## 9. What a Full Mock Test Engine Must Contain

A faithful full-length PTE Academic mock test must adhere to the following architecture:

- **Exact Question Set:**
  - Part 1: Personal Intro (1, unscored) + Read Aloud (6–7) + Repeat Sentence (10–12) + Describe Image (5–6) + Retell Lecture (2–3) + Answer Short Question (5–6) + Summarize Group Discussion (2–3) + Respond to a Situation (2–3) + Summarize Written Text (1–2) + Write Essay (1–2).
  - Part 2: Reading & Writing FIB (5–6) + Reading MCMA (1–2) + Reorder Paragraphs (2–3) + Reading FIB Drag & Drop (4–5) + Reading MCSA (1–2).
  - Part 3: Summarize Spoken Text (1–2) + Listening MCMA (1–2) + Listening FIB (2–3) + Highlight Correct Summary (1–2) + Listening MCSA (1–2) + Select Missing Word (1–2) + Highlight Incorrect Words (2–3) + Write from Dictation (3–4).
- **Total Question Volume:** 65 to 75 questions.
- **Section Timing Architecture:**
  - Speaking/Writing: ~76–84 minutes total (governed by per-item prep/record timers and 10m/20m writing timers).
  - Reading: Single countdown of ~23–30 minutes for all reading items combined.
  - Listening: 10 minutes per SST; followed by a single countdown of ~21–29 minutes for all remaining listening items combined.
- **Scoring Pipeline:**
  - Negative marking on exactly MCMA (Reading), MCMA (Listening), and HIW (Listening), with item floors at 0.
  - Integrated cross-skill points routing (e.g. Read Aloud points added to both Reading and Speaking aggregates).
  - Normalization to the 10–90 scale with a hard minimum floor of 10.

---

## 10. Scope Guard: Other PTE Tests

Do not confuse PTE Academic with other Pearson tests:

| Test | Purpose | Differences from PTE Academic |
|---|---|---|
| **PTE Academic UKVI** | UK Visa & Immigration (SELT) | **Identical** format, timing, question types, and scoring to PTE Academic. The only difference is the addition of a SELT Unique Reference Number (URN) on the score report. |
| **PTE Core** | Canadian Immigration (IRCC) | General/workplace English test. Contains 19 question types (includes Email Writing, different prompt contexts, shorter ~2h format). |
| **PTE Home (A1, A2, B1)** | UK family, partner, and settlement visas | Simple two-skills test (Speaking & Listening only), 22–32 minutes duration, scored as Pass/Fail. |

---

## 11. Known Deltas: Current Platform Build vs. Official Spec

> **Audit Guide for Developers:** Use this table to understand where the current repository code stands relative to the canonical PTE Academic specification:

| # | Item | Official PTE Academic Spec | Current Repository Build | Status & Action Required |
|---|---|---|---|---|
| **D1** | **Question Types Supported** | 22 scored types (+1 unscored intro) | Currently implements 18 types across 45 seeded items. Missing: *Summarize Group Discussion*, *Respond to a Situation*, *Highlight Incorrect Words*, and *Personal Introduction*. | 🔴 **High Priority:** Implement UI and evaluator for the missing types (SGD, RTS, HIW). |
| **D2** | **Item Type Naming** | Official name is **Select Missing Word** | Repo uses legacy name *"Highlight Missing Words"* | 🟡 **Cosmetic:** Align UI display name with official Pearson naming. |
| **D3** | **Read Aloud Skills Fed** | **Reading and Speaking** | Previously documented in older notes as Speaking only | ✅ **Resolved in Spec:** Corrected. Evaluator should award Reading points for Content accuracy. |
| **D4** | **R&W FIB Dropdown Skills** | **Reading and Writing** | Previously treated as Reading only | ✅ **Resolved in Spec:** Corrected. Evaluator must feed points to both Reading and Writing. |
| **D5** | **Listening FIB Skills** | **Listening and Writing** | Previously treated as Listening only | ✅ **Resolved in Spec:** Corrected. Evaluator must award Writing points for correct spelling. |
| **D6** | **SWT Scoring Rubric** | Content 0–2, Form 0–1, Grammar 0–2, Vocab 0–2 (Max 7 pts) | Evaluator previously used outdated 6-factor weight (including spelling/written discourse) | 🟡 **Evaluator Task:** Update SWT rubric weights to official 7-point scale. |
| **D7** | **Write Essay Rubric** | Content 0–3, Form 0–2, DSC 0–2, Grammar 0–2, GLR 0–2, Vocab 0–2, Spelling 0–2 (Max 15 pts) | Evaluator previously assumed Content was 0–6 | 🟡 **Evaluator Task:** Align Essay scoring weights with official 15-point rubric. |
| **D8** | **Summarize Spoken Text** | Content 0–2, Form 0–2, Grammar 0–2, Vocab 0–2, Spelling 0–2 (Max 10 pts) | Evaluator previously assumed Content was 0–4 | 🟡 **Evaluator Task:** Align SST scoring weights with official 10-point rubric. |
| **D9** | **Describe Image Rubric** | Content 0–5, Fluency 0–5, Pronunciation 0–5 (Max 15 pts) | Evaluator previously assumed Content was 0–6 | 🟡 **Evaluator Task:** Align DI Content scale to 0–5. |
| **D10** | **Reading & Listening Timers** | **Pooled section timers** (23–30m Reading; 21–29m non-SST Listening) | Repo currently assigns per-item timers to Reading and Listening items | 🟡 **Engine Architecture:** Transition simulator towards pooled section timers. |
| **D11** | **Question Count** | **65–75 items** per full mock | Seeded full mock (#18) currently has 45 items — `seed.js` now builds **49** (4 folded items), pending re-seed | 🔴 **Content Bank:** Expand test generator to assemble full 65–75 item tests. |
| **D12** | **Repeat Sentence Response Timer** | **15 seconds** | Repo previously permitted 40s | 🔴 **Timer Fix:** Set RS response countdown to exactly 15 seconds. |
| **D13** | **Answer Short Question Response Timer** | **10 seconds** (no tone) | Repo previously permitted 12s | 🟡 **Timer Fix:** Align ASQ timer to 10 seconds. |
| **D14** | **Speaking Content Verification** | Speech-to-text transcript alignment against target prompt | Repo caps Content at 0.8 due to absence of local STT | 🟠 **Feature Backlog:** Integrate Speech-to-Text (e.g. Whisper / Web Speech API) to enable true 90-point scoring. |

---

## 12. Official Sources & References

1. **Pearson PTE Academic Test Taker Score Guide** (Official Scoring Handbook):  
   `https://www.pearsonpte.com/content/dam/ELL/pte/pearsonpte/pdfs/pte-academic-pdfs/PTE-Academic-Test-Taker-Score-Guide.pdf`
2. **PTE Academic Test Taker Handbook** (Exam Day Rules & Technical Invariants):  
   `https://www.pearsonpte.com/content/dam/ELL/pte/pearsonpte/pdfs/test-taker-handbook-pte-academic.pdf`
3. **PTE Academic Test Format Overview:**  
   `https://www.pearsonpte.com/pte-academic/test-format/`
4. **Speaking & Writing Question Types:**  
   `https://www.pearsonpte.com/pte-academic/test-format/speaking-writing/`
5. **Reading Question Types:**  
   `https://www.pearsonpte.com/pte-academic/test-format/reading/`
6. **Listening Question Types:**  
   `https://www.pearsonpte.com/pte-academic/test-format/listening/`
7. **PTE Scoring & IELTS/CEFR Concordance:**  
   `https://www.pearsonpte.com/pte-academic/scoring/`
8. **What to Expect on Test Day:**  
   `https://www.pearsonpte.com/on-test-day/`
