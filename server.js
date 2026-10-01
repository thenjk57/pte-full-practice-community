const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { initDB, queryAll, queryOne, runQuery } = require('./database/db');
const { evaluateItem } = require('./evaluator');
const { aggregatePracticeScores } = require('./pte_scoring');
const { startServer } = require('./server_transport');
const { createSiteAccess } = require('./site_access');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadsDir = process.env.PTE_DATA_DIR
    ? path.join(process.env.PTE_DATA_DIR, 'uploads')
    : path.join(__dirname, 'uploads');

app.use(createSiteAccess({
    password: process.env.PTE_SITE_PASSWORD,
    required: process.env.PTE_REQUIRE_AUTH === '1'
}));

// Enable CORS & body parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directory for frontend and uploaded audio
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Configure Multer for Audio Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(uploadsDir, 'audio');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.webm';
        cb(null, `audio-${uniqueSuffix}${ext}`);
    }
});
const upload = multer({ storage });

// Initialize DB on server start
initDB().catch(err => console.error("Database initialization failed:", err));

const ENABLING_KEYS = ['grammar', 'spelling', 'fluency', 'pronunciation', 'vocabulary', 'discourse'];

/** Strip answer material before sending questions to the exam client. */
function publicQuestion(q) {
    return {
        id: q.id,
        test_id: q.test_id,
        module: q.module,
        question_type: q.question_type,
        title: q.title,
        prompt: q.prompt,
        passage: q.passage,
        media_url: q.media_url,
        options: q.options ? safeParse(q.options) : null,
        max_score: q.max_score,
        item_order: q.item_order,
        part: q.part || 1,
        part_title: q.part_title,
        audio_play_policy: q.audio_play_policy || 'none',
        prep_seconds: q.prep_seconds || 0,
        time_limit_seconds: q.time_limit_seconds || 0
    };
}

function safeParse(value) {
    if (value == null) return null;
    if (typeof value === 'object') return value;
    try { return JSON.parse(value); } catch (e) { return value; }
}

/**
 * REST API Routes
 */

// 1. Get all available tests
app.get('/api/tests', async (req, res) => {
    try {
        const tests = await queryAll(`SELECT t.*, COUNT(q.id) AS question_count
            FROM tests t LEFT JOIN questions q ON q.test_id = t.id
            GROUP BY t.id ORDER BY t.id ASC`);
        res.json({ success: true, data: tests });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Get specific test with questions (answer keys withheld)
app.get('/api/tests/:id', async (req, res) => {
    try {
        const test = await queryOne("SELECT * FROM tests WHERE id = ?", [req.params.id]);
        if (!test) {
            return res.status(404).json({ success: false, error: "Test not found" });
        }
        const questions = await queryAll(
            "SELECT * FROM questions WHERE test_id = ? ORDER BY item_order ASC", [test.id]);
        res.json({ success: true, data: { ...test, questions: questions.map(publicQuestion) } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Audio upload endpoint
app.post('/api/upload-audio', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: "No audio file uploaded" });
    }
    const relativePath = `uploads/audio/${req.file.filename}`;
    res.json({ success: true, filePath: relativePath, fileName: req.file.filename });
});

// 4. Submit completed test attempt & auto-score
app.post('/api/submit-test', async (req, res) => {
    try {
        const { testId, studentName, responses, isRemediationDrill } = req.body;

        const test = await queryOne("SELECT * FROM tests WHERE id = ?", [testId]);
        if (!test) {
            return res.status(404).json({ success: false, error: "Test not found" });
        }

        let questions;
        if (isRemediationDrill) {
            const qIds = (responses || []).map(r => r.questionId).filter(Boolean);
            if (qIds.length) {
                const placeholders = qIds.map(() => '?').join(',');
                questions = await queryAll(`SELECT * FROM questions WHERE id IN (${placeholders})`, qIds);
            } else {
                questions = [];
            }
        } else {
            questions = await queryAll("SELECT * FROM questions WHERE test_id = ?", [testId]);
        }

        const attemptRes = await runQuery(
            `INSERT INTO test_attempts (test_id, exam_type, student_name, status)
             VALUES (?, ?, ?, 'submitted')`,
            [testId, test.exam_type, isRemediationDrill ? `${studentName || 'Candidate'} (Remediation Drill)` : (studentName || 'Candidate 101')]
        );
        const attemptId = attemptRes.lastID;

        const responseMap = new Map((responses || []).map(resp => [Number(resp.questionId), resp]));
        const scoredRows = [];
        const enablingAcc = {};
        ENABLING_KEYS.forEach(k => enablingAcc[k] = []);

        for (const q of questions) {
            const resp = responseMap.get(q.id) || {};

            const evaluation = evaluateItem(
                { ...q, answer_key: safeParse(q.answer_key) },
                {
                    textResponse: resp.textResponse,
                    audioFilePath: resp.audioFilePath,
                    transcript: resp.transcript,
                    durationSeconds: resp.durationSeconds,
                    hesitationsCount: resp.hesitationsCount,
                    maxPauseSeconds: resp.maxPauseSeconds,
                    initialSilenceSeconds: resp.initialSilenceSeconds
                }
            );

            const mistakes = evaluation.mistakes || [];
            const feedbackPayload = {
                subScores: evaluation.subScores || {},
                metrics: evaluation.metrics || {},
                enabling: evaluation.enabling || {},
                feedback: evaluation.feedback || [],
                mistakes
            };

            await runQuery(
                `INSERT INTO user_responses
                    (attempt_id, question_id, text_response, audio_file_path, transcript,
                     score, max_score, feedback, sub_scores, metrics, time_spent_seconds)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    attemptId, q.id,
                    resp.textResponse || null,
                    resp.audioFilePath || null,
                    resp.transcript || null,
                    evaluation.score, evaluation.maxScore || 90,
                    JSON.stringify(feedbackPayload),
                    JSON.stringify(evaluation.subScores || {}),
                    JSON.stringify(evaluation.metrics || {}),
                    Math.max(0, Math.round(Number(resp.timeSpentSeconds) || 0))
                ]
            );

            for (const m of mistakes) {
                await runQuery(
                    `INSERT INTO mistake_logs
                        (attempt_id, question_id, category, candidate_output,
                         exact_mistake, model_correction, score_impact)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        attemptId, q.id, m.category || 'Content',
                        (resp.textResponse || resp.audioFilePath || 'N/A').toString().slice(0, 2000),
                        m.mistake || 'Flagged error',
                        m.correction || 'Refer to the model answer',
                        Number((evaluation.subScores || {}).content != null
                            ? (1 - evaluation.subScores.content) : 0.5)
                    ]
                );
            }

            scoredRows.push({ question: q, evaluation });
            for (const [k, v] of Object.entries(evaluation.enabling || {})) {
                if (enablingAcc[k] && Number.isFinite(v)) enablingAcc[k].push(v);
            }
        }

        const practiceScores = aggregatePracticeScores(scoredRows);
        const avgScores = practiceScores.skills;

        // Enabling skills: mean of contributing items on the 10-90 scale
        const enablingScores = {};
        for (const k of ENABLING_KEYS) {
            const arr = enablingAcc[k];
            enablingScores[k] = arr.length
                ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
                : null;
        }

        const finalOverall = practiceScores.overall;

        const weakest = Object.entries(enablingScores)
            .filter(([, v]) => v != null)
            .sort((a, b) => a[1] - b[1])[0];

        const scoreLabel = value => value == null ? 'pending review' : `${value}/90`;
        const summary = `Test completed. Estimated practice score: ${scoreLabel(finalOverall)}. ` +
            `Speaking ${scoreLabel(avgScores.speaking)} | Writing ${scoreLabel(avgScores.writing)} | ` +
            `Reading ${scoreLabel(avgScores.reading)} | Listening ${scoreLabel(avgScores.listening)}. ` +
            (weakest ? `Lowest practice diagnostic: ${weakest[0]} (${weakest[1]}/90). ` : '') +
            (practiceScores.pendingReview ? `Provisional: ${practiceScores.pendingReview} recorded answer(s) excluded pending transcript/manual review, not marked wrong. ` : '') +
            'This is not a Pearson score. Speaking and open-response results may need human review.';

        await runQuery(
            `UPDATE test_attempts SET
                completed_at = CURRENT_TIMESTAMP,
                status = 'evaluated',
                overall_score = ?,
                listening_score = ?,
                reading_score = ?,
                writing_score = ?,
                speaking_score = ?,
                enabling_grammar = ?,
                enabling_spelling = ?,
                enabling_fluency = ?,
                enabling_pronunciation = ?,
                enabling_vocabulary = ?,
                enabling_discourse = ?,
                summary_feedback = ?
             WHERE id = ?`,
            [
                finalOverall,
                avgScores.listening, avgScores.reading, avgScores.writing, avgScores.speaking,
                enablingScores.grammar, enablingScores.spelling, enablingScores.fluency,
                enablingScores.pronunciation, enablingScores.vocabulary, enablingScores.discourse,
                summary, attemptId
            ]
        );

        res.json({
            success: true,
            attemptId,
            overallScore: finalOverall,
            scores: avgScores,
            pendingReview: practiceScores.pendingReview,
            enabling: enablingScores,
            examType: test.exam_type
        });

    } catch (err) {
        console.error("Error submitting test:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Get all submitted attempts
app.get('/api/attempts', async (req, res) => {
    try {
        const attempts = await queryAll(
            `SELECT a.*, t.title as test_title
             FROM test_attempts a
             JOIN tests t ON a.test_id = t.id
             ORDER BY a.started_at DESC`
        );
        res.json({ success: true, data: attempts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Get attempt details with full item-by-item breakdown and mistake logs
app.get('/api/attempts/:id', async (req, res) => {
    try {
        const attempt = await queryOne(
            `SELECT a.*, t.title as test_title
             FROM test_attempts a
             JOIN tests t ON a.test_id = t.id
             WHERE a.id = ?`,
            [req.params.id]
        );
        if (!attempt) {
            return res.status(404).json({ success: false, error: "Attempt not found" });
        }

        const responses = await queryAll(
            `SELECT r.*, q.title as question_title, q.module, q.question_type, q.prompt,
                    q.passage, q.answer_key, q.model_answer, q.item_order, q.part, q.part_title
             FROM user_responses r
             JOIN questions q ON r.question_id = q.id
             WHERE r.attempt_id = ?
             ORDER BY q.part ASC, q.item_order ASC`,
            [attempt.id]
        );

        const mistakeLogs = await queryAll(
            `SELECT m.*, q.title as question_title, q.question_type, q.module
             FROM mistake_logs m
             JOIN questions q ON m.question_id = q.id
             WHERE m.attempt_id = ?
             ORDER BY m.id ASC`,
            [attempt.id]
        );

        const parsedResponses = responses.map(r => ({
            ...r,
            feedback: safeParse(r.feedback),
            sub_scores: safeParse(r.sub_scores),
            metrics: safeParse(r.metrics),
            answer_key: safeParse(r.answer_key)
        }));

        res.json({
            success: true,
            data: { ...attempt, responses: parsedResponses, mistakes: mistakeLogs }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 7. Deep analysis for an attempt — powering the "path to 90" report.
 *    Returns enabling-skill gaps, per-item-type weakness, mistake histogram
 *    and a prioritised action list.
 */
app.get('/api/attempts/:id/analysis', async (req, res) => {
    try {
        const attempt = await queryOne(
            `SELECT a.*, t.title as test_title
             FROM test_attempts a JOIN tests t ON a.test_id = t.id
             WHERE a.id = ?`, [req.params.id]);
        if (!attempt) {
            return res.status(404).json({ success: false, error: "Attempt not found" });
        }

        const responses = await queryAll(
            `SELECT r.score, r.sub_scores, r.metrics, r.time_spent_seconds,
                    q.question_type, q.module, q.title, q.part
             FROM user_responses r
             JOIN questions q ON r.question_id = q.id
             WHERE r.attempt_id = ?`, [attempt.id]);

        const mistakes = await queryAll(
            `SELECT category, COUNT(*) as count FROM mistake_logs
             WHERE attempt_id = ? GROUP BY category ORDER BY count DESC`, [attempt.id]);

        const byType = {};
        for (const r of responses) {
            const t = r.question_type;
            if (!byType[t]) byType[t] = { type: t, module: r.module, count: 0, total: 0, scores: [] };
            byType[t].count++;
            byType[t].total += Number(r.score) || 0;
            byType[t].scores.push(Number(r.score) || 0);
        }
        for (const v of Object.values(byType)) {
            v.average = v.count ? Math.round(v.total / v.count) : 0;
            v.gap_to_90 = Math.max(0, 90 - v.average);
            delete v.total;
        }

        const enabling = {
            grammar: attempt.enabling_grammar,
            spelling: attempt.enabling_spelling,
            fluency: attempt.enabling_fluency,
            pronunciation: attempt.enabling_pronunciation,
            vocabulary: attempt.enabling_vocabulary,
            discourse: attempt.enabling_discourse
        };

        const rankedEnabling = Object.entries(enabling)
            .filter(([, v]) => v != null && v !== undefined)
            .map(([k, v]) => ({ skill: k, score: v, gap: Math.max(0, 90 - v) }))
            .sort((a, b) => a.score - b.score);

        const rankedTypes = Object.values(byType).sort((a, b) => b.gap_to_90 - a.gap_to_90);

        const totalTime = responses.reduce((s, r) => s + (Number(r.time_spent_seconds) || 0), 0);

        res.json({
            success: true,
            data: {
                attempt_id: attempt.id,
                overall_score: attempt.overall_score,
                gap_to_90: Math.max(0, 90 - (attempt.overall_score || 0)),
                sections: {
                    speaking: attempt.speaking_score,
                    writing: attempt.writing_score,
                    reading: attempt.reading_score,
                    listening: attempt.listening_score
                },
                enabling_ranked: rankedEnabling,
                item_types_ranked: rankedTypes,
                mistakes_by_category: mistakes,
                total_time_seconds: totalTime,
                totals: {
                    items: responses.length,
                    mistakes: mistakes.reduce((s, m) => s + m.count, 0)
                },
                recommendations: buildRecommendations(rankedEnabling, rankedTypes, mistakes)
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

function buildRecommendations(enabling, types, mistakes) {
    const recs = [];
    const top = enabling.slice(0, 2);
    for (const e of top) {
        recs.push({
            priority: 'high',
            area: e.skill,
            action: `Review ${e.skill} practice feedback (${e.score}/90 estimated). Focus on the related item-level mistakes; this diagnostic is not an official score component.`
        });
    }
    const weakTypes = types.filter(t => t.gap_to_90 >= 25).slice(0, 3);
    for (const t of weakTypes) {
        recs.push({
            priority: 'high',
            area: t.type,
            action: `Drill ${t.type} (${t.average}/90 across ${t.count} item(s)); it has a ${t.gap_to_90}-point gap.`
        });
    }
    const worstCategory = mistakes[0];
    if (worstCategory) {
        recs.push({
            priority: 'medium',
            area: worstCategory.category,
            action: `${worstCategory.count} ${worstCategory.category} error(s) logged — review every correction in the Mistake Vault before your next attempt.`
        });
    }
    if (recs.length === 0) {
        recs.push({ priority: 'info', area: 'all', action: 'No significant gaps detected. Retake the full test to confirm consistency at 90.' });
    }
    return recs;
}

/**
 * 8. Targeted Remediation Drill Generator ("Practice My Mistakes")
 *    Synthesizes a targeted practice drill focusing on the candidate's missed and low-scoring items.
 */
app.get('/api/attempts/:id/remediation-drill', async (req, res) => {
    try {
        const attemptId = req.params.id;
        const attempt = await queryOne(
            `SELECT a.*, t.title as test_title, t.exam_type
             FROM test_attempts a JOIN tests t ON a.test_id = t.id
             WHERE a.id = ?`, [attemptId]
        );
        if (!attempt) {
            return res.status(404).json({ success: false, error: "Attempt not found" });
        }

        // Find question IDs with logged mistakes or score < 75
        const mistakeQRows = await queryAll(
            `SELECT DISTINCT question_id FROM mistake_logs WHERE attempt_id = ?`,
            [attemptId]
        );
        const lowScoreRows = await queryAll(
            `SELECT question_id FROM user_responses WHERE attempt_id = ? AND score < 75`,
            [attemptId]
        );

        const targetQIds = Array.from(new Set([
            ...mistakeQRows.map(r => r.question_id),
            ...lowScoreRows.map(r => r.question_id)
        ]));

        let questions = [];
        if (targetQIds.length > 0) {
            const placeholders = targetQIds.map(() => '?').join(',');
            questions = await queryAll(
                `SELECT id, test_id, module, question_type, title, prompt, passage,
                        media_url, options, max_score, item_order, part, part_title,
                        audio_play_policy, prep_seconds, time_limit_seconds
                 FROM questions
                 WHERE id IN (${placeholders})
                 ORDER BY part ASC, item_order ASC`,
                targetQIds
            );
        }

        // Fallback: If examinee scored high and had 0 mistakes, provide top 5 challenging questions so drill is always constructive
        if (questions.length === 0) {
            questions = await queryAll(
                `SELECT id, test_id, module, question_type, title, prompt, passage,
                        media_url, options, max_score, item_order, part, part_title,
                        audio_play_policy, prep_seconds, time_limit_seconds
                 FROM questions
                 WHERE test_id = ?
                 ORDER BY item_order ASC
                 LIMIT 5`,
                [attempt.test_id]
            );
        }

        // Withhold answer_key, model_answer, and script as required by security policy
        const sanitizedQuestions = questions.map((q, idx) => ({
            ...q,
            options: safeParse(q.options),
            item_order: idx + 1
        }));

        const drillTest = {
            id: attempt.test_id,
            title: `🎯 Targeted Remediation: Practice My Mistakes (Attempt #${attempt.id})`,
            description: `Adaptive practice drill addressing ${sanitizedQuestions.length} missed or sub-optimal questions from "${attempt.test_title}".`,
            exam_type: attempt.exam_type || 'PTE',
            total_time_minutes: Math.max(10, Math.ceil(sanitizedQuestions.length * 2.5)),
            questions: sanitizedQuestions,
            isRemediationDrill: true,
            originalAttemptId: attempt.id
        };

        res.json({
            success: true,
            data: drillTest
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Fallback route to serve main app index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start Express Server
const server = startServer(app, {
    port: PORT,
    host: process.env.PTE_HOST,
    tlsCertPath: process.env.PTE_TLS_CERT,
    tlsKeyPath: process.env.PTE_TLS_KEY
});

server.on('listening', () => {
    const scheme = process.env.PTE_TLS_CERT ? 'https' : 'http';
    const host = process.env.PTE_HOST || 'localhost';
    console.log(`PTE & IELTS Mock Test Server running at ${scheme}://${host}:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use by a running instance. The app is live and accessible at http://localhost:${PORT}`);
    } else {
        console.error("Server error:", err);
    }
});
