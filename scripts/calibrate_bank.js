#!/usr/bin/env node
/**
 * Smoke / calibration harness for the generated mock-test bank.
 *
 * Drives the REAL HTTP submit path (POST /api/submit-test) twice against a
 * generated test:
 *
 *   1. perfect  — every answer taken from answer_key. Expected:
 *        overall >= 80, reading = 90, listening >= 85,
 *        zero 'Content' mistakes, no answer_key/model_answer leaked by the API.
 *   2. empty    — every item blank. Expected: overall EXACTLY 10
 *        (the documented floor guardrail).
 *
 * Answer keys are read straight from the DB (the exam API must not expose
 * them — that is asserted separately).
 *
 * Usage:
 *   node server.js &                      # on PORT (default 3998 for smoke)
 *   node scripts/calibrate_bank.js        # BASE=http://localhost:3998
 *   node scripts/calibrate_bank.js --test-id 12
 */
const { initDB, queryAll, queryOne } = require('../database/db');

const BASE = process.env.BASE || ('http://localhost:' + (process.env.PORT || 3999));
const args = process.argv.slice(2);
const argVal = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

function parseKey(raw) { try { return JSON.parse(raw); } catch (e) { return {}; } }

async function api(pathname, opts = {}) {
    const res = await fetch(BASE + pathname, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.success === false) {
        throw new Error(`API ${pathname} -> ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
    }
    return body;
}

/** Build the ideal response payload for one question row. */
function perfectResponse(q, key) {
    const base = { questionId: q.id, timeSpentSeconds: 5 };
    const speakingTypes = ['read_aloud', 'repeat_sentence', 'describe_image', 'retell_lecture'];

    switch (q.question_type) {
        case 'answer_short_question': {
            // Verified spoken answer (simulates real speech-to-text transcript).
            return {
                ...base,
                audioFilePath: 'uploads/audio/calibration.webm',
                transcript: key.model_answer,
                durationSeconds: 6,
            };
        }
        case 'write_essay':
        case 'summarize_written_text':
        case 'summarize_spoken_text':
            return { ...base, textResponse: q.model_answer };
        case 'write_from_dictation':
            return { ...base, textResponse: key.model_answer };
        case 'reading_fill_blanks':
        case 'rw_fill_blanks':
        case 'listening_fill_blanks':
        case 'highlight_missing_words': {
            const answers = {};
            for (const [k, v] of Object.entries(key.answers || {})) {
                answers[k] = Array.isArray(v) ? v[0] : v;
            }
            return { ...base, textResponse: JSON.stringify(answers) };
        }
        case 'mcma':
        case 'mcsa':
        case 'highlight_correct_summary':
            return { ...base, textResponse: JSON.stringify(key.correct || []) };
        case 'reorder_paragraphs':
            return { ...base, textResponse: JSON.stringify(key.sequence || []) };
        default:
            if (speakingTypes.includes(q.question_type)) {
                const target = key.target_words || 12;
                const allowed = q.time_limit_seconds || 40;
                const duration = Math.max(2, Math.min(target / 2.5, allowed * 0.9));
                return {
                    ...base,
                    audioFilePath: 'uploads/audio/calibration.webm',
                    durationSeconds: Math.round(duration * 10) / 10,
                };
            }
            throw new Error(`No perfect-response rule for ${q.question_type}`);
    }
}

async function runMode(testId, questions, mode) {
    const responses = questions.map((q) => {
        if (mode === 'empty') {
            return { questionId: q.id, textResponse: '', audioFilePath: null, durationSeconds: 0, timeSpentSeconds: 1 };
        }
        return perfectResponse(q, parseKey(q.answer_key));
    });
    const body = await api('/api/submit-test', {
        method: 'POST',
        body: JSON.stringify({
            testId,
            studentName: `bank-${mode}`,
            responses,
        }),
    });
    const attempt = await api(`/api/attempts/${body.attemptId}`);
    const mistakes = attempt.data?.mistakes || [];
    const mistakeCount = mistakes.length;
    const contentMistakes = mistakes.filter((m) => m.category === 'Content').length;
    return { body, mistakeCount, contentMistakes };
}

async function main() {
    await initDB();

    /* ---- pick the test -------------------------------------------------- */
    let testId = parseInt(argVal('--test-id') || '0', 10);
    let test;
    if (testId) {
        test = await queryOne('SELECT * FROM tests WHERE id = ?', [testId]);
    } else {
        test = await queryOne(
            `SELECT * FROM tests WHERE title = 'PTE Academic Full Mock Test 2'`);
    }
    if (!test) throw new Error('Generated test not found — run generate_mock_bank.js first');
    testId = test.id;

    const questions = await queryAll(
        'SELECT * FROM questions WHERE test_id = ? ORDER BY item_order', [testId]);
    if (questions.length !== 45) throw new Error(`Test ${testId} has ${questions.length} items, expected 45`);
    console.log(`Calibrating against test ${testId}: "${test.title}" (${questions.length} items)`);

    /* ---- security: public payload must withhold answers ------------------ */
    const pub = await api(`/api/tests/${testId}`);
    const leak = pub.data.questions.filter((q) =>
        'answer_key' in q || 'model_answer' in q || 'script' in q);
    if (leak.length) {
        console.error(`SECURITY FAIL: ${leak.length} questions expose answer material`);
        process.exit(1);
    }
    console.log('Security: GET /api/tests/:id withholds answer_key, model_answer, script ✓');

    const failures = [];

    /* ---- perfect --------------------------------------------------------- */
    const perfect = await runMode(testId, questions, 'perfect');
    const p = perfect.body;
    console.log(`\nPERFECT  overall=${p.overallScore}  S=${p.scores.speaking} W=${p.scores.writing} `
        + `R=${p.scores.reading} L=${p.scores.listening}  mistakes=${perfect.mistakeCount} `
        + `(content=${perfect.contentMistakes})  attempt=#${p.attemptId}`);
    console.log('  enabling:', JSON.stringify(p.enabling));
    if (p.overallScore < 80) failures.push(`perfect overall ${p.overallScore} < 80`);
    if (p.scores.reading !== 90) failures.push(`perfect reading ${p.scores.reading} != 90`);
    if (p.scores.listening < 85) failures.push(`perfect listening ${p.scores.listening} < 85`);
    if (p.scores.speaking < 80) failures.push(`perfect speaking ${p.scores.speaking} < 80`);
    if (p.scores.writing < 75) failures.push(`perfect writing ${p.scores.writing} < 75`);
    if (perfect.contentMistakes !== 0) failures.push(`perfect run logged ${perfect.contentMistakes} Content mistakes`);

    /* ---- empty ----------------------------------------------------------- */
    const empty = await runMode(testId, questions, 'empty');
    const e = empty.body;
    console.log(`\nEMPTY    overall=${e.overallScore}  S=${e.scores.speaking} W=${e.scores.writing} `
        + `R=${e.scores.reading} L=${e.scores.listening}  mistakes=${empty.mistakeCount}  attempt=#${e.attemptId}`);
    if (e.overallScore !== 10) failures.push(`empty overall ${e.overallScore} != 10 floor`);
    if (e.scores.speaking !== 10 || e.scores.writing !== 10 ||
        e.scores.reading !== 10 || e.scores.listening !== 10) {
        failures.push(`empty sections not all 10: ${JSON.stringify(e.scores)}`);
    }
    if (empty.mistakeCount < 40) failures.push(`empty run only logged ${empty.mistakeCount} mistakes`);

    /* ---- verdict ---------------------------------------------------------- */
    if (failures.length) {
        console.error('\nCALIBRATION FAILED:');
        for (const f of failures) console.error('  - ' + f);
        process.exit(1);
    }
    console.log('\nALL BANK CALIBRATION CHECKS PASSED');
    process.exit(0);
}

main().catch((err) => {
    console.error('calibrate_bank failed:', err);
    process.exit(1);
});
