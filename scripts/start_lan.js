const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ensureLanCertificate, isPrivateIPv4 } = require('./lan_tls');

function chooseLanHost(override, routeOutput) {
    const host = override || (routeOutput.match(/\bsrc\s+(\d+\.\d+\.\d+\.\d+)\b/) || [])[1];
    if (!isPrivateIPv4(host)) {
        throw new Error(`LAN host must be a private IPv4 address; got ${host || 'none'}`);
    }
    return host;
}

function main() {
    const route = process.env.PTE_LAN_HOST ? '' : execFileSync(
        'ip', ['-4', 'route', 'get', '1.1.1.1'], { encoding: 'utf8'
    });
    const host = chooseLanHost(process.env.PTE_LAN_HOST, route);
    const port = Number(process.env.PTE_LAN_PORT || 3443);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) {
        throw new Error('PTE_LAN_PORT must be an integer from 1024 to 65535');
    }
    const certDir = process.env.PTE_LAN_CERT_DIR || path.join(
        os.homedir(), '.local', 'share', 'pte-full-practice', 'lan-tls'
    );
    const certs = ensureLanCertificate(certDir, host);

    process.env.PORT = String(port);
    process.env.PTE_HOST = host;
    process.env.PTE_TLS_CERT = certs.tlsCertPath;
    process.env.PTE_TLS_KEY = certs.tlsKeyPath;

    console.log(`LAN URL: https://${host}:${port}`);
    console.log(`Install this public CA certificate on each client device: ${certs.caCertPath}`);
    console.log('Never share the CA private key or the server private key.');
    require('../server');
}

if (require.main === module) {
    try {
        main();
    } catch (err) {
        console.error(`Could not start LAN server: ${err.message}`);
        process.exitCode = 1;
    }
}

module.exports = { chooseLanHost };
