import { Router } from 'express';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET = 'oauth2-mock-secret';

// In-memory stores
const authCodes = new Map();   // code → { clientId, username, scope, expiresAt }
const tokens = new Map();      // token → { username, scope, expiresAt }

const CLIENTS = {
  'demo-client': { secret: 'demo-secret', redirectUri: 'http://localhost:5173/#/oauth2/callback' },
};

const USERS = {
  alice: { password: 'password123', name: 'Alice', email: 'alice@example.com' },
};

// Step 1: Authorization endpoint — mock login page handled by redirecting with ?code=
router.get('/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;
  const client = CLIENTS[client_id];
  if (!client || client.redirectUri !== redirect_uri || response_type !== 'code') {
    return res.status(400).json({ error: 'invalid_request' });
  }
  // Return a form for the user to "log in"
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Mock OAuth2 Auth Server</title>
    <style>body{font-family:sans-serif;max-width:400px;margin:80px auto;padding:20px;background:#0f172a;color:#e2e8f0}
    h2{color:#60a5fa}input,button{width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:14px}
    button{background:#3b82f6;border:none;cursor:pointer;font-weight:600}button:hover{background:#2563eb}
    .info{background:#1e293b;border:1px solid #334155;padding:12px;border-radius:6px;margin-bottom:16px;font-size:13px}
    .label{color:#94a3b8;font-size:12px;margin-top:8px}</style>
    </head>
    <body>
      <h2>Mock Auth Server</h2>
      <div class="info">
        <div class="label">Client requesting access</div>
        <strong>${client_id}</strong>
        <div class="label">Requested scope</div>
        <strong>${scope || 'read'}</strong>
      </div>
      <form method="POST" action="/oauth2/approve">
        <input type="hidden" name="client_id" value="${client_id}" />
        <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
        <input type="hidden" name="scope" value="${scope || 'read'}" />
        <input type="hidden" name="state" value="${state || ''}" />
        <input name="username" placeholder="Username (try: alice)" value="alice" />
        <input name="password" type="password" placeholder="Password (try: password123)" value="password123" />
        <button type="submit">Approve & Authorize</button>
      </form>
    </body>
    </html>
  `);
});

// Step 2: User approves, server issues auth code and redirects
router.post('/approve', (req, res) => {
  const { username, password, client_id, redirect_uri, scope, state } = req.body;
  const user = USERS[username];
  if (!user || user.password !== password) {
    return res.status(401).send('Invalid credentials');
  }
  const code = randomBytes(16).toString('hex');
  authCodes.set(code, { clientId: client_id, username, scope, expiresAt: Date.now() + 60_000 });
  // Append params directly to preserve hash-based redirect URIs (e.g. /#/oauth2/callback)
  let callbackUrl = redirect_uri + `?code=${encodeURIComponent(code)}`;
  if (state) callbackUrl += `&state=${encodeURIComponent(state)}`;
  res.redirect(callbackUrl);
});

// Step 3: Exchange auth code for access token
router.post('/token', (req, res) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;
  const client = CLIENTS[client_id];
  if (!client || client.secret !== client_secret || client.redirectUri !== redirect_uri) {
    return res.status(401).json({ error: 'invalid_client' });
  }
  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }
  const entry = authCodes.get(code);
  if (!entry || entry.clientId !== client_id || entry.expiresAt < Date.now()) {
    authCodes.delete(code);
    return res.status(400).json({ error: 'invalid_grant' });
  }
  authCodes.delete(code);
  const accessToken = randomBytes(32).toString('hex');
  tokens.set(accessToken, { username: entry.username, scope: entry.scope, expiresAt: Date.now() + 3600_000 });
  res.json({ access_token: accessToken, token_type: 'Bearer', expires_in: 3600, scope: entry.scope });
});

// Step 4: Access protected resource with token
router.get('/resource', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }
  const entry = tokens.get(auth.slice(7));
  if (!entry || entry.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const user = USERS[entry.username];
  res.json({ message: 'Access granted', user: { username: entry.username, name: user.name, email: user.email }, scope: entry.scope });
});

export default router;
