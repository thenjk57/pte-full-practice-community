const test = require('node:test');
const assert = require('node:assert/strict');
const { bindAudio, alignmentIssues } = require('../database/audio_contract');

test('changing a script changes its audio URL even at the same question position', () => {
    const make = script => ({ audio_play_policy: 'once', media_url: '/audio/exam/gen/t02_wfd_44.mp3', answer_key: { script } });
    const old = bindAudio([make('Globalization can preserve musical heritage.')])[0];
    const revised = bindAudio([make('State agencies are subject to privacy legislation.')])[0];
    assert.notEqual(old.media_url, revised.media_url);
    assert.match(revised.media_url, /^\/audio\/exam\/gen\/v2\/[a-f0-9]{64}\.mp3$/);
});

test('a correct listening choice must be supported by its own script', () => {
    const question = { question_type: 'mcsa', audio_play_policy: 'once',
        options: JSON.stringify({ choices: [{ label: 'A', text: 'Globalization can preserve musical heritage.' }] }),
        answer_key: { script: 'State agencies are subject to privacy legislation.', correct: ['A'] } };
    assert.ok(alignmentIssues(question).some(i => /choice/i.test(i)));
});

test('filling the listening blanks must reconstruct the spoken script', () => {
    const question = { question_type: 'listening_fill_blanks', audio_play_policy: 'once',
        passage: 'State agencies follow [blank1] legislation.',
        answer_key: { script: 'State agencies follow privacy legislation.', answers: { blank1: ['musical'] } } };
    assert.ok(alignmentIssues(question).some(i => /transcript/i.test(i)));
    question.answer_key.answers.blank1 = ['privacy'];
    assert.deepEqual(alignmentIssues(question), []);
});

test('matching choice and script pass without rejecting intentional distractors', () => {
    const question = { question_type: 'mcsa', audio_play_policy: 'once',
        options: { choices: [{ label: 'A', text: 'State agencies follow privacy legislation.' }, { label: 'B', text: 'Fish have scales.' }] },
        answer_key: { script: 'State agencies follow privacy legislation.', correct: ['A'] } };
    assert.deepEqual(alignmentIssues(question), []);
});

test('a generated correct summary must use statements from its own recording', () => {
    const question = { question_type: 'highlight_correct_summary', audio_play_policy: 'once',
        options: { choices: [{ label: 'A', text: 'This recording explains that fish have scales and that agencies follow privacy legislation.' }] },
        answer_key: { script: 'Fish have scales. Agencies follow privacy legislation.', correct: ['A'] } };
    assert.deepEqual(alignmentIssues(question), []);
    question.answer_key.script = 'Marine viruses regulate bacterial populations.';
    assert.ok(alignmentIssues(question).some(i => /summary/i.test(i)));
});
