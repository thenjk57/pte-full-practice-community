const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const https = require('node:https');
const http = require('node:http');
const { execFileSync } = require('node:child_process');

const { startServer } = require('../server_transport');

function request(protocol, options) {
    return new Promise((resolve, reject) => {
        protocol.get(options, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, body }));
        }).on('error', reject);
    });
}

test('HTTPS listener serves on the selected LAN address with a trusted certificate', async (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pte-lan-test-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const key = path.join(dir, 'key.pem');
    const cert = path.join(dir, 'cert.pem');
    execFileSync('openssl', [
        'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
        '-keyout', key, '-out', cert, '-subj', '/CN=127.0.0.1',
        '-addext', 'subjectAltName=IP:127.0.0.1'
    ], { stdio: 'ignore' });

    const server = startServer((req, res) => res.end('PTE ready'), {
        port: 0, host: '127.0.0.1', tlsCertPath: cert, tlsKeyPath: key
    });
    t.after(() => server.close());
    await new Promise((resolve) => server.once('listening', resolve));

    assert.equal(server.address().address, '127.0.0.1');
    const result = await request(https, {
        hostname: '127.0.0.1', port: server.address().port, ca: fs.readFileSync(cert)
    });
    assert.deepEqual(result, { status: 200, body: 'PTE ready' });

    await t.test('plain HTTP on the HTTPS port redirects instead of returning an empty response', async () => {
        const redirect = await new Promise((resolve, reject) => {
            http.get({
                hostname: '127.0.0.1', port: server.address().port,
                path: '/?test=1', headers: { Host: 'untrusted.example' }, agent: false
            }, (res) => {
                let body = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { body += chunk; });
                res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body }));
            }).on('error', reject);
        });
        assert.equal(redirect.status, 308);
        assert.equal(redirect.location, `https://127.0.0.1:${server.address().port}/?test=1`);
        assert.equal(redirect.body.includes('PTE ready'), false);
    });
});

test('partial HTTPS configuration fails closed instead of starting HTTP', () => {
    assert.throws(() => startServer(() => {}, {
        port: 0, host: '127.0.0.1', tlsCertPath: '/missing/cert.pem'
    }), /both.*cert.*key/i);
});

test('ordinary HTTP startup remains available for localhost and Fly', async (t) => {
    const server = startServer((req, res) => res.end('HTTP ready'), {
        port: 0, host: '127.0.0.1'
    });
    t.after(() => server.close());
    await new Promise((resolve) => server.once('listening', resolve));
    const result = await request(http, {
        hostname: '127.0.0.1', port: server.address().port
    });
    assert.deepEqual(result, { status: 200, body: 'HTTP ready' });
});
