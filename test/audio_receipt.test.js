const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { verifyAudioFile } = require('../database/audio_contract');

test('unverified old audio is not reused; receipt binds script and exact MP3 bytes', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pte-audio-receipt-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'sample.mp3');
    fs.writeFileSync(file, Buffer.alloc(1200, 1));
    const item = { path: file, script: 'State agencies follow privacy legislation.', voice: 'en-GB-RyanNeural', rate: '+0%' };
    const run = expression => {
        const result = spawnSync('python3', ['-c', `import sys, json; sys.path.insert(0, 'scripts'); from audio_receipt import audio_is_current, write_receipt; item=json.loads(sys.argv[1]); ${expression}`, JSON.stringify(item)], { encoding: 'utf8' });
        assert.equal(result.status, 0, result.stderr);
        return result.stdout.trim();
    };
    assert.equal(run('print(audio_is_current(item))'), 'False');
    assert.equal(verifyAudioFile(file, { script: item.script }), false);
    run('write_receipt(item)');
    assert.equal(run('print(audio_is_current(item))'), 'True');
    assert.equal(verifyAudioFile(file, { script: item.script }), true);
    assert.equal(verifyAudioFile(file, { script: 'Fish have scales.' }), false);
    assert.equal(run("item['script']='Fish have scales.'; print(audio_is_current(item))"), 'False');
    fs.writeFileSync(file, Buffer.alloc(1200, 2));
    assert.equal(run('print(audio_is_current(item))'), 'False');
    assert.equal(verifyAudioFile(file, { script: item.script }), false);
});
