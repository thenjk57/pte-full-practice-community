const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateItem } = require('../evaluator');

const question = {
    question_type: 'answer_short_question',
    module: 'speaking',
    answer_key: { type: 'answer_short_question', model_answer: 'thermometer', acceptable: ['thermometer'] }
};

test('recorded ASQ without verified words is pending review, not marked wrong', () => {
    const result = evaluateItem(question, { audioFilePath: 'uploads/audio/example.webm', durationSeconds: 3 });
    assert.equal(result.score, null);
    assert.equal(result.metrics.verified, false);
    assert.match(result.feedback.join(' '), /cannot be scored automatically/i);
});

test('ASQ uses verified transcript for vocabulary only', () => {
    const result = evaluateItem(question, { audioFilePath: 'uploads/audio/example.webm', transcript: 'thermometer' });
    assert.equal(result.score, 90);
    assert.equal(result.metrics.correct, true);
    assert.equal(result.subScores.oral_fluency, undefined);
});
