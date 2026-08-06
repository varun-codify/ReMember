const allowedOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const allowCors = fn => async (req, res) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
        // Explicitly trusted origin -> reflect it (allowed with credentials)
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
        // No credentials are sent by this API (Bearer tokens, not cookies),
        // so a wildcard origin is safe here and must NOT be combined with
        // Access-Control-Allow-Credentials (browsers reject that combo).
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Vault-Passkey'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    return await fn(req, res);
};

module.exports = allowCors;
