-- Database Schema for PTE Academic Mock Test Platform

CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    exam_type TEXT CHECK(exam_type IN ('PTE', 'IELTS')) NOT NULL DEFAULT 'PTE',
    description TEXT,
    total_time_minutes INTEGER NOT NULL DEFAULT 120,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    module TEXT CHECK(module IN ('speaking', 'writing', 'reading', 'listening')) NOT NULL,
    question_type TEXT NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT,
    passage TEXT,
    media_url TEXT,
    options TEXT, -- JSON: item-specific options (MCQ choices, dropdown word banks, chart spec)
    answer_key TEXT, -- JSON: canonical answer envelope, see PTE_FULL_MOCK_TEST.md
    max_score INTEGER DEFAULT 10,
    item_order INTEGER NOT NULL,

    -- Authentic PTE exam metadata -------------------------------------------
    part INTEGER DEFAULT 1,             -- 1 = Speaking & Writing, 2 = Reading, 3 = Listening
    part_title TEXT,                    -- human readable section label
    audio_play_policy TEXT DEFAULT 'none', -- 'once' = single play, no replay; 'none' = no audio
    prep_seconds INTEGER DEFAULT 0,     -- preparation countdown before recording/response
    time_limit_seconds INTEGER DEFAULT 0, -- response window for this item
    model_answer TEXT,                  -- model/band-9 answer for analysis & corrections
    rubric TEXT,                        -- JSON sub-score weights used to reach 10-90
    scored_enabling TEXT,               -- JSON list of enabling skills this item feeds

    FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    exam_type TEXT NOT NULL DEFAULT 'PTE',
    student_name TEXT DEFAULT 'Candidate 101',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT CHECK(status IN ('in_progress', 'submitted', 'evaluated')) DEFAULT 'in_progress',
    overall_score REAL,
    listening_score REAL,
    reading_score REAL,
    writing_score REAL,
    speaking_score REAL,
    enabling_grammar REAL,
    enabling_spelling REAL,
    enabling_fluency REAL,
    enabling_pronunciation REAL,
    enabling_vocabulary REAL,
    enabling_discourse REAL,
    summary_feedback TEXT,
    FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    text_response TEXT,
    audio_file_path TEXT,
    transcript TEXT,
    score REAL,
    max_score REAL,
    feedback TEXT,
    -- Granular analytics ------------------------------------------------------
    sub_scores TEXT,        -- JSON: per-rubric-component scores before 10-90 scaling
    metrics TEXT,           -- JSON: word/sentence counts, accuracy, playbacks observed
    time_spent_seconds INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Dedicated Granular Mistake & Correction Logging Table
CREATE TABLE IF NOT EXISTS mistake_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    category TEXT CHECK(category IN ('Grammar', 'Spelling', 'Vocabulary', 'Fluency', 'Form/Length', 'Content', 'Punctuation')) NOT NULL,
    candidate_output TEXT,
    exact_mistake TEXT NOT NULL,
    model_correction TEXT NOT NULL,
    score_impact REAL DEFAULT 0,
    status TEXT CHECK(status IN ('unresolved', 'practicing', 'mastered')) DEFAULT 'unresolved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_questions_test ON questions(test_id, item_order);
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON user_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_attempt ON mistake_logs(attempt_id);
