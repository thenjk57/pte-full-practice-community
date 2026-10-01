const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const { createSiteAccess } = require('../site_access');

async function requestWithHeader(header) {
    const app = express();
    app.use(createSiteAccess({ password: 'private-example', required: true }));
    app.get('/api/attempts', (_req, res) => res.json({ private: true }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
        return await new Promise((resolve, reject) => {
            const req = http.get({
                hostname: '127.0.0.1', port: server.address().port,
                path: '/api/attempts', headers: header ? { Authorization: header } : {}
            }, (res) => {
                let body = '';
                res.on('data', chunk => { body += chunk; });
                res.on('end', () => resolve({ status: res.statusCode, body }));
            });
            req.on('error', reject);
        });
    } finally {
        server.close();
    }
}

test('private attempt routes reject anonymous and incorrect credentials', async () => {
    const wrong = 'Basic ' + Buffer.from('practice:wrong').toString('base64');
    assert.equal((await requestWithHeader()).status, 401);
    assert.equal((await requestWithHeader(wrong)).status, 401);
});

test('private attempt routes allow the configured password', async () => {
    const right = 'Basic ' + Buffer.from('practice:private-example').toString('base64');
    const result = await requestWithHeader(right);
    assert.equal(result.status, 200);
    assert.deepEqual(JSON.parse(result.body), { private: true });
});

test('required private mode refuses to start without a password', () => {
    assert.throws(() => createSiteAccess({ required: true }), /password/i);
});
