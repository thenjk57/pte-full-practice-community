const { initDB, queryAll, runQuery, queryOne } = require('./db');
const { evaluateItem } = require('../evaluator');

/**
 * Re-score an existing attempt from stored responses and print a report.
 *   npm run evaluate          -> latest attempt
 *   npm run evaluate 12       -> attempt #12
 */

const ENABLING_KEYS = ['grammar', 'spelling', 'fluency', 'pronunciation', 'vocabulary', 'discourse'];
const SECTION_KEYS = ['speaking', 'writing', 'reading', 'listening'];

async function evaluateAttempt(attemptIdArg) {
    await initDB();

    let attempt;
    if (attemptIdArg) {
        attempt = await queryOne(
            `SELECT a.*, t.title as test_title FROM test_attempts a
             JOIN tests t ON a.test_id = t.id WHERE a.id = ?`, [attemptIdArg]);
    } else {
        attempt = await queryOne(
            `SELECT a.*, t.title as test_title FROM test_attempts a
             JOIN tests t ON a.test_id = t.id ORDER BY a.started_at DESC LIMIT 1`);
    }

    if (!attempt) {
        console.log('No test attempts found in the database.');
        process.exit(0);
    }

    console.log('\n======================================================');
    console.log(' PTE EXAMINER EVALUATION REPORT');
    console.log(` Candidate : ${attempt.student_name}`);
    console.log(` Test      : ${attempt.test_title} (${attempt.exam_type})`);
    console.log(` Attempt   : #${attempt.id}`);
    console.log('======================================================\n');

    const responses = await queryAll(
        `SELECT r.*, q.title as question_title, q.module, q.question_type, q.passage,
                q.answer_key, q.model_answer, q.part, q.part_title, q.item_order
         FROM user_responses r
         JOIN questions q ON r.question_id = q.id
         WHERE r.attempt_id = ?
         ORDER BY q.part ASC, q.item_order ASC`, [attempt.id]);

    await runQuery('DELETE FROM mistake_logs WHERE attempt_id = ?', [attempt.id]);

    const sectionAcc = { speaking: [], writing: [], reading: [], listening: [] };
    const enablingAcc = {};
    ENABLING_KEYS.forEach(k => enablingAcc[k] = []);

    let lastPart = null;

    for (const r of responses) {
        if (r.part !== lastPart) {
            lastPart = r.part;
            console.log(`\n---------- ${r.part_title || 'Part ' + r.part} ----------`);
        }

        let answerKey = null;
        try { answerKey = r.answer_key ? JSON.parse(r.answer_key) : null; } catch (e) { answerKey = null; }

        const evaluation = evaluateItem(
            { ...r, answer_key: answerKey },
            {
                textResponse: r.text_response,
                audioFilePath: r.audio_file_path,
                transcript: r.transcript,
                durationSeconds: (r.metrics ? (JSON.parse(r.metrics).durationSeconds) : 0)
            }
        );

        const mistakes = evaluation.mistakes || [];

        console.log(`► ${r.question_title}  [${r.module}/${r.question_type}]`);
        console.log(`  Score: ${evaluation.score}/90`);
        if (evaluation.subScores) {
            console.log(`  Sub-scores: ${JSON.stringify(evaluation.subScores)}`);
        }
        if (r.text_response) {
            console.log(`  Response: "${String(r.text_response).substring(0, 100)}${r.text_response.length > 100 ? '…' : ''}"`);
        }
        if (r.audio_file_path) console.log(`  Audio: ${r.audio_file_path}`);
        if (mistakes.length) {
            console.log(`  Mistakes (${mistakes.length}):`);
            mistakes.slice(0, 5).forEach(m =>
                console.log(`   - [${m.category}] ${m.mistake} → ${m.correction}`));
        }
        console.log('------------------------------------------------------');

        for (const m of mistakes) {
            await runQuery(
                `INSERT INTO mistake_logs
                    (attempt_id, question_id, category, candidate_output, exact_mistake, model_correction, score_impact)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [attempt.id, r.question_id, m.category || 'Content',
                 String(r.text_response || r.audio_file_path || 'N/A').slice(0, 2000),
                 m.mistake || 'Flagged error',
                 m.correction || 'Refer to the model answer',
                 evaluation.subScores && evaluation.subScores.content != null
                    ? 1 - evaluation.subScores.content : 0.5]
            );
        }

        await runQuery(
            `UPDATE user_responses SET score = ?, max_score = ?, feedback = ?, sub_scores = ?, metrics = ? WHERE id = ?`,
            [evaluation.score, evaluation.maxScore || 90,
             JSON.stringify({ subScores: evaluation.subScores, metrics: evaluation.metrics, enabling: evaluation.enabling, feedback: evaluation.feedback, mistakes }),
             JSON.stringify(evaluation.subScores || {}),
             JSON.stringify(evaluation.metrics || {}), r.id]
        );

        if (sectionAcc[r.module]) sectionAcc[r.module].push(evaluation.score);
        for (const [k, v] of Object.entries(evaluation.enabling || {})) {
            if (enablingAcc[k] && Number.isFinite(v)) enablingAcc[k].push(v);
        }
    }

    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 10;
    const sectionScores = {};
    SECTION_KEYS.forEach(m => sectionScores[m] = avg(sectionAcc[m]));

    const enablingScores = {};
    ENABLING_KEYS.forEach(k =>
        enablingScores[k] = enablingAcc[k].length
            ? Math.round(enablingAcc[k].reduce((a, b) => a + b, 0) / enablingAcc[k].length)
            : null);

    const used = SECTION_KEYS.filter(m => sectionAcc[m].length > 0);
    const overall = used.length
        ? Math.round(used.reduce((s, m) => s + sectionScores[m], 0) / used.length)
        : 10;

    await runQuery(
        `UPDATE test_attempts SET
            status = 'evaluated', overall_score = ?, listening_score = ?, reading_score = ?,
            writing_score = ?, speaking_score = ?, enabling_grammar = ?, enabling_spelling = ?,
            enabling_fluency = ?, enabling_pronunciation = ?, enabling_vocabulary = ?,
            enabling_discourse = ?, summary_feedback = ?
         WHERE id = ?`,
        [overall, sectionScores.listening, sectionScores.reading, sectionScores.writing,
         sectionScores.speaking, enablingScores.grammar, enablingScores.spelling,
         enablingScores.fluency, enablingScores.pronunciation, enablingScores.vocabulary,
         enablingScores.discourse,
         `Re-evaluated. Overall PTE Score: ${overall}/90 (gap ${Math.max(0, 90 - overall)}).`,
         attempt.id]
    );

    console.log('\n======================================================');
    console.log(` FINAL SCORECARD (${attempt.exam_type}) — attempt #${attempt.id}`);
    console.log(` Overall : ${overall} / 90   (gap ${Math.max(0, 90 - overall)})`);
    console.log(` Sections: Speaking ${sectionScores.speaking} | Writing ${sectionScores.writing} | Reading ${sectionScores.reading} | Listening ${sectionScores.listening}`);
    console.log(' Enabling:');
    ENABLING_KEYS.forEach(k => {
        const v = enablingScores[k];
        if (v != null) console.log(`   ${k.padEnd(14)} ${String(v).padStart(3)} / 90   gap ${Math.max(0, 90 - v)}`);
    });
    console.log('======================================================\n');

    process.exit(0);
}

evaluateAttempt(process.argv[2]).catch(err => {
    console.error('Evaluation error:', err);
    process.exit(1);
});
