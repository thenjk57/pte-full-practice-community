const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');

function startServer(app, { port = 3000, host, tlsCertPath, tlsKeyPath } = {}) {
    if (Boolean(tlsCertPath) !== Boolean(tlsKeyPath)) {
        throw new Error('HTTPS requires both a cert path and a key path');
    }

    let server;
    if (tlsCertPath) {
        const secureServer = https.createServer({
            cert: fs.readFileSync(tlsCertPath),
            key: fs.readFileSync(tlsKeyPath)
        }, app);
        const redirectServer = http.createServer((req, res) => {
            const address = req.socket.localAddress;
            const hostname = net.isIPv6(address) ? `[${address}]` : address;
            const requestPath = req.url.startsWith('/') ? req.url : '/';
            res.writeHead(308, {
                Location: `https://${hostname}:${req.socket.localPort}${requestPath}`,
                'Cache-Control': 'no-store', Connection: 'close'
            });
            res.end();
        });
        // Browsers may interpret a bare IP:port as HTTP. Peek at the first byte
        // to redirect those requests, while only HTTPS can reach the app.
        server = net.createServer((socket) => {
            socket.setTimeout(10000, () => socket.destroy());
            socket.on('error', () => {});
            socket.once('readable', () => {
                const firstByte = socket.read(1);
                if (!firstByte) return socket.destroy();
                socket.unshift(firstByte);
                socket.setTimeout(0);
                const target = firstByte[0] === 22 ? secureServer : redirectServer;
                target.emit('connection', socket);
            });
        });
    } else {
        server = http.createServer(app);
    }

    return host ? server.listen(port, host) : server.listen(port);
}

module.exports = { startServer };
