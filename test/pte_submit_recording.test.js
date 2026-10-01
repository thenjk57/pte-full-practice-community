const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('submitting waits for the final speaking upload before sending responses', async () => {
    let submitted;
    const context = {
        window: { appRouter: { showScorecard() {} } },
        document: { body: { classList: { remove() {} } }, getElementById: () => null,
            querySelector: () => null, querySelectorAll: () => [] },
        fetch: async (_url, init) => { submitted = JSON.parse(init.body); return { json: async () => ({ success: true, attemptId: 1 }) }; },
        clearInterval() {}, console, Date
    };
    vm.runInNewContext(fs.readFileSync('public/js/pte_exam.js', 'utf8'), context);
    const engine = context.window.pteEngine;
    engine.test = { id: 1 };
    engine.questions = [{ id: 7, module: 'speaking' }];
    engine.currentIndex = 0;
    engine.recording = true;
    engine.itemStartedAt = Date.now();
    engine.endRecording = async () => {
        await Promise.resolve();
        engine.responses[7] = { questionId: 7, audioFilePath: 'uploads/audio/final.webm' };
        engine.recording = false;
    };
    await engine.submitTest();
    assert.equal(submitted.responses[0].audioFilePath, 'uploads/audio/final.webm');
});
