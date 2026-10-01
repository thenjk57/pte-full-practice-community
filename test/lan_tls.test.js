const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { ensureLanCertificate, isPrivateIPv4 } = require('../scripts/lan_tls');

test('creates a reusable CA and an IP-matched server certificate outside the app', (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pte-ca-test-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const first = ensureLanCertificate(dir, '192.168.1.84');
    const firstCa = fs.readFileSync(first.caCertPath);
    assert.equal(fs.statSync(dir).mode & 0o777, 0o700);
    assert.equal(fs.statSync(first.caKeyPath).mode & 0o777, 0o600);
    assert.equal(fs.statSync(first.tlsKeyPath).mode & 0o777, 0o600);
    assert.match(execFileSync('openssl', ['x509', '-in', first.tlsCertPath, '-noout', '-ext', 'subjectAltName'], { encoding: 'utf8' }), /IP Address:192\.168\.1\.84/);
    execFileSync('openssl', ['verify', '-CAfile', first.caCertPath, first.tlsCertPath]);

    const second = ensureLanCertificate(dir, '192.168.1.85');
    assert.deepEqual(fs.readFileSync(second.caCertPath), firstCa);
    assert.notEqual(second.tlsCertPath, first.tlsCertPath);
    assert.ok(fs.existsSync(first.tlsCertPath));
    assert.match(execFileSync('openssl', ['x509', '-in', second.tlsCertPath, '-noout', '-ext', 'subjectAltName'], { encoding: 'utf8' }), /IP Address:192\.168\.1\.85/);
});

test('refuses public and malformed IPs for LAN binding', () => {
    assert.equal(isPrivateIPv4('192.168.1.84'), true);
    assert.equal(isPrivateIPv4('10.77.77.2'), true);
    assert.equal(isPrivateIPv4('172.18.0.1'), true);
    assert.equal(isPrivateIPv4('8.8.8.8'), false);
    assert.equal(isPrivateIPv4('2400:1a00::1'), false);
    assert.equal(isPrivateIPv4('not-an-ip'), false);
});
