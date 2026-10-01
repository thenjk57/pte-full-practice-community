const crypto = require('node:crypto');

function createSiteAccess({ password, required = false } = {}) {
    if (required && !password) {
        throw new Error('PTE_SITE_PASSWORD is required for private site access');
    }
    if (!password) return (_req, _res, next) => next();

    const expected = Buffer.from(`practice:${password}`);
    return (req, res, next) => {
        const header = req.get('authorization') || '';
        const encoded = /^Basic\s+([A-Za-z0-9+/]+={0,2})$/i.exec(header)?.[1];
        const supplied = encoded ? Buffer.from(encoded, 'base64') : Buffer.alloc(0);
        const valid = supplied.length === expected.length &&
            crypto.timingSafeEqual(supplied, expected);
        if (valid) return next();

        res.set('WWW-Authenticate', 'Basic realm="PTE Practice", charset="UTF-8"');
        res.set('Cache-Control', 'no-store');
        return res.status(401).send('Private PTE practice site. Sign in to continue.');
    };
}

module.exports = { createSiteAccess };
