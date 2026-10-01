const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateItem } = require('../evaluator');
const question = { question_type: 'read_aloud', prompt: 'Look at the text below.',
    passage: 'Urban trees reduce summer temperatures.', time_limit_seconds: 40,
    answer_key: { type: 'read_aloud', key_points: ['urban', 'trees'], target_words: 5 } };

test('read-aloud alignment compares the passage, not exam instructions', () => {
    const result = evaluateItem(question, { audioFilePath: 'example.webm', durationSeconds: 4, transcript: question.passage });
    assert.equal(result.metrics.word_alignment[0].word, 'Urban');
});

test('a recording without a transcript does not fabricate word-level correctness', () => {
    const result = evaluateItem(question, { audioFilePath: 'example.webm', durationSeconds: 4 });
    assert.deepEqual(result.metrics.word_alignment, []);
    assert.equal(result.metrics.content_verified, false);
    assert.match(result.feedback.join(' '), /unverified|proxy/i);
});
