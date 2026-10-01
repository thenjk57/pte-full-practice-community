const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function engineForRender() {
    const container = { innerHTML: '' };
    const context = {
        window: {}, document: { getElementById: id => id === 'exam-content-area' ? container : null },
        console, Date
    };
    vm.runInNewContext(fs.readFileSync('public/js/pte_exam.js', 'utf8'), context);
    const engine = context.window.pteEngine;
    engine.bindItemEvents = () => {};
    engine.startItemTimer = () => {};
    engine.startSpeakingPrep = () => {};
    engine.questions = [{ id: 1 }];
    engine.totalSeconds = 100;
    return { engine, container };
}

test('essay screen shows its actual topic, not only generic instructions', () => {
    const { engine, container } = engineForRender();
    engine.renderItem({ id: 1, part: 1, module: 'writing', question_type: 'write_essay',
        prompt: 'You have 20 minutes. Topic: Should cities invest in cycle lanes?',
        passage: null, options: null, audio_play_policy: 'none' });
    assert.match(container.innerHTML, /Should cities invest in cycle lanes/);
});

test('reorder screen shows boxes supplied as option objects without a passage', () => {
    const { engine, container } = engineForRender();
    engine.renderItem({ id: 1, part: 2, module: 'reading', question_type: 'reorder_paragraphs',
        prompt: 'Reorder these sentences.', passage: null, audio_play_policy: 'none',
        options: { boxes: [{ id: 'A', text: 'The first real sentence.' }, { id: 'B', text: 'The second real sentence.' }] } });
    assert.match(container.innerHTML, /The first real sentence/);
    assert.match(container.innerHTML, /The second real sentence/);
});

test('multiple-choice screen preserves its item-specific question', () => {
    const { engine, container } = engineForRender();
    engine.renderItem({ id: 1, part: 2, module: 'reading', question_type: 'mcsa',
        prompt: 'What is the writer’s main argument?', passage: 'A passage about urban farming.',
        audio_play_policy: 'none', options: { choices: [{ label: 'A', text: 'It saves land.' }] } });
    assert.match(container.innerHTML, /What is the writer’s main argument/);
});
