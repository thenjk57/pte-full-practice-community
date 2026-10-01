const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function isPrivateIPv4(value) {
    if (net.isIP(value) !== 4) return false;
    const parts = value.split('.').map(Number);
    return parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168);
}

function openssl(args) {
    execFileSync('openssl', args, { stdio: 'ignore' });
}

function ensureLanCertificate(dir, ip) {
    if (!isPrivateIPv4(ip)) {
        throw new Error(`Refusing non-private IPv4 LAN address: ${ip}`);
    }
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.chmodSync(dir, 0o700);

    const caKeyPath = path.join(dir, 'ca.key');
    const caCertPath = path.join(dir, 'ca.crt');
    const caKeyExists = fs.existsSync(caKeyPath);
    const caCertExists = fs.existsSync(caCertPath);
    if (caKeyExists !== caCertExists) {
        throw new Error('Incomplete local CA: refusing to replace the existing certificate or key');
    }
    if (!caKeyExists) {
        openssl([
            'req', '-x509', '-newkey', 'rsa:3072', '-sha256', '-nodes',
            '-days', '3650', '-keyout', caKeyPath, '-out', caCertPath,
            '-subj', '/CN=PTE Local Practice CA',
            '-addext', 'basicConstraints=critical,CA:TRUE',
            '-addext', 'keyUsage=critical,keyCertSign,cRLSign'
        ]);
        fs.chmodSync(caKeyPath, 0o600);
    }

    const stem = `server-${ip.replaceAll('.', '-')}`;
    const tlsKeyPath = path.join(dir, `${stem}.key`);
    const tlsCertPath = path.join(dir, `${stem}.crt`);
    const keyExists = fs.existsSync(tlsKeyPath);
    const certExists = fs.existsSync(tlsCertPath);
    if (keyExists !== certExists) {
        throw new Error(`Incomplete LAN certificate for ${ip}: refusing to replace it`);
    }
    if (!keyExists) {
        const csrPath = path.join(dir, `${stem}.csr`);
        const extensionsPath = path.join(dir, `${stem}.ext`);
        fs.writeFileSync(extensionsPath, [
            `subjectAltName=IP:${ip}`,
            'basicConstraints=critical,CA:FALSE',
            'keyUsage=critical,digitalSignature,keyEncipherment',
            'extendedKeyUsage=serverAuth',
            ''
        ].join('\n'), { mode: 0o600 });
        openssl([
            'req', '-new', '-newkey', 'rsa:2048', '-sha256', '-nodes',
            '-keyout', tlsKeyPath, '-out', csrPath, '-subj', `/CN=${ip}`
        ]);
        fs.chmodSync(tlsKeyPath, 0o600);
        openssl([
            'x509', '-req', '-in', csrPath, '-CA', caCertPath, '-CAkey', caKeyPath,
            '-CAcreateserial', '-out', tlsCertPath, '-days', '825', '-sha256',
            '-extfile', extensionsPath
        ]);
        fs.unlinkSync(csrPath);
        fs.unlinkSync(extensionsPath);
    }

    return { caKeyPath, caCertPath, tlsKeyPath, tlsCertPath };
}

module.exports = { ensureLanCertificate, isPrivateIPv4 };
