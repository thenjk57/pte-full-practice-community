const test = require('node:test');
const assert = require('node:assert/strict');

const { chooseLanHost } = require('../scripts/start_lan');

test('uses the private default-route source address, not another active interface', () => {
    const route = '1.1.1.1 via 192.168.1.254 dev wlp3s0 src 192.168.1.84 uid 1000';
    assert.equal(chooseLanHost(undefined, route), '192.168.1.84');
});

test('a private explicit address overrides route selection', () => {
    assert.equal(chooseLanHost('10.77.77.2', 'not a route'), '10.77.77.2');
});

test('refuses non-private route source and explicit public addresses', () => {
    assert.throws(() => chooseLanHost(undefined, '8.8.8.8 dev eth0 src 8.8.8.8'), /private.*IPv4/i);
    assert.throws(() => chooseLanHost('8.8.8.8', ''), /private.*IPv4/i);
});
