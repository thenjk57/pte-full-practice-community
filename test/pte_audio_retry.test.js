const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('failed autoplay can be retried exactly once after user gesture', async () => {
    let autoStart;
    let attempts = 0;
    const nodes = Object.fromEntries(['audio-status', 'audio-progress-bar', 'btn-play-once', 'pearson-vol-slider']
        .map(id => [id, { style: {}, classList: { add() {}, remove() {} }, addEventListener(name, cb) { if (id === 'btn-play-once') this.click = cb; } }]));
    class FakeAudio {
        addEventListener() {}
        pause() {}
        play() { attempts++; return attempts === 1 ? Promise.reject(new Error('blocked')) : Promise.resolve(); }
    }
    const context = {
        window: {}, document: { getElementById: id => nodes[id] || null },
        Audio: FakeAudio, setTimeout: fn => { autoStart = fn; },
        console
    };
    vm.runInNewContext(fs.readFileSync('public/js/pte_exam.js', 'utf8'), context);
    const engine = context.window.pteEngine;
    engine.startSinglePlayAudio({ question_type: 'write_from_dictation', module: 'listening', media_url: '/audio/a.mp3' });
    autoStart();
    await Promise.resolve();
    assert.equal(engine.audioState.played, false);
    nodes['btn-play-once'].click();
    assert.equal(attempts, 2);
    assert.equal(engine.audioState.played, true);
});
