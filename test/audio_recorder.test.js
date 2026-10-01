const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('two simultaneous starts create just one MediaRecorder', async () => {
    let created = 0;
    const releaseMic = [];
    const events = [];
    class FakeMediaRecorder {
        constructor() { created++; this.mimeType = 'audio/webm'; }
        static isTypeSupported() { return true; }
        start() { this.state = 'recording'; }
        stop() { this.state = 'inactive'; this.onstop(); }
    }
    const context = {
        window: { dispatchEvent: event => events.push(event), AudioContext: class {
            createAnalyser() { return { fftSize: 256, frequencyBinCount: 4, getByteFrequencyData() {} }; }
            createMediaStreamSource() { return { connect() {} }; }
        } },
        navigator: { mediaDevices: { getUserMedia: () => new Promise(resolve => { releaseMic.push(resolve); }) } },
        MediaRecorder: FakeMediaRecorder,
        setInterval: () => 1, clearInterval() {}, Date, Uint8Array,
        console, CustomEvent: class {}, Blob
    };
    vm.runInNewContext(fs.readFileSync('public/js/audio_recorder.js', 'utf8'), context);
    const recorder = context.window.audioRecorder;
    const first = recorder.startRecording(null);
    const second = recorder.startRecording(null);
    releaseMic.forEach(resolve => resolve({}));
    assert.equal(await first, true);
    assert.equal(await second, false);
    assert.equal(created, 1);
});
