const test = require('node:test');
const assert = require('node:assert/strict');
const { skillContributions, aggregatePracticeScores } = require('../pte_scoring');

test('current Pearson skill contributions include integrated tasks without legacy extra skills', () => {
    assert.deepEqual(skillContributions('read_aloud'), ['speaking']);
    assert.deepEqual(skillContributions('rw_fill_blanks'), ['reading']);
    assert.deepEqual(skillContributions('repeat_sentence'), ['listening', 'speaking']);
    assert.deepEqual(skillContributions('summarize_written_text'), ['reading', 'writing']);
    assert.deepEqual(skillContributions('highlight_incorrect_words'), ['listening', 'reading']);
    assert.deepEqual(skillContributions('answer_short_question'), ['listening']);
});

test('practice overall uses item points rather than an average of four skills', () => {
    const rows = [
        { question: { question_type: 'read_aloud', max_score: 10 }, evaluation: { score: 90 } },
        { question: { question_type: 'repeat_sentence', max_score: 10 }, evaluation: { score: 90 } },
        { question: { question_type: 'write_essay', max_score: 10 }, evaluation: { score: 10 } }
    ];
    const result = aggregatePracticeScores(rows);
    assert.equal(result.skills.speaking, 90);
    assert.equal(result.skills.listening, 90);
    assert.equal(result.skills.writing, 10);
    assert.equal(result.overall, 63);
});

test('unattempted integrated item contributes the floor to both assessed skills', () => {
    const result = aggregatePracticeScores([
        { question: { question_type: 'write_from_dictation', max_score: 10 }, evaluation: { score: 10 } }
    ]);
    assert.equal(result.skills.listening, 10);
    assert.equal(result.skills.writing, 10);
    assert.equal(result.skills.speaking, 10);
});

test('unverified recorded answers do not count as failed scored items', () => {
    const result = aggregatePracticeScores([
        { question: { question_type: 'repeat_sentence', max_score: 10 }, evaluation: { score: 90 } },
        { question: { question_type: 'answer_short_question', max_score: 10 }, evaluation: { score: null, metrics: { verified: false } } }
    ]);
    assert.equal(result.skills.listening, 90);
    assert.equal(result.overall, 90);
    assert.equal(result.pendingReview, 1);
});
test('only pending answers yield no overall or listening score', () => {
    const result = aggregatePracticeScores([{ question: { question_type: 'answer_short_question', max_score: 10 }, evaluation: { score: null, metrics: { verified: false } } }]);
    assert.equal(result.overall, null);
    assert.equal(result.skills.listening, null);
});
