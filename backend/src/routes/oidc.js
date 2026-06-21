import { Router } from 'express';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET = 'oidc-mock-secret';

const authCodes = new Map();
const tokens = new Map();

const CLIENTS = {
  'oidc-client': { secret: 'oidc-secret', redirectUri: 'http://localhost:5173/#/oidc/callback' },
};

const USERS = {
  alice: { password: 'password123', name: 'Alice', email: 'alice@example.com', sub: 'usr_alice_001' },
};

router.get('/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state, nonce } = req.query;
  const client = CLIENTS[client_id];
  if (!client || client.redirectUri !== redirect_uri || response_type !== 'code') {
    return res.status(400).json({ error: 'invalid_request' });
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Mock OIDC Provider</title>
    <style>body{font-family:sans-serif;max-width:400px;margin:80px auto;padding:20px;background:#0f172a;color:#e2e8f0}
    h2{color:#a78bfa}input,button{width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:14px}
    button{background:#7c3aed;border:none;cursor:pointer;font-weight:600}button:hover{background:#6d28d9}
    .info{background:#1e293b;border:1px solid #334155;padding:12px;border-radius:6px;margin-bottom:16px;font-size:13px}
    .label{color:#94a3b8;font-size:12px;margin-top:8px}</style>
    </head>
    <body>
      <h2>Mock OIDC Provider</h2>
      <div class="info">
        <div class="label">Client</div><strong>${client_id}</strong>
        <div class="label">Scope</div><strong>${scope || 'openid profile email'}</strong>
      </div>
      <form method="POST" action="/oidc/approve">
        <input type="hidden" name="client_id" value="${client_id}" />
        <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
        <input type="hidden" name="scope" value="${scope || 'openid profile email'}" />
        <input type="hidden" name="state" value="${state || ''}" />
        <input type="hidden" name="nonce" value="${nonce || ''}" />
        <input name="username" placeholder="Username (try: alice)" value="alice" />
        <input name="password" type="password" placeholder="Password (try: password123)" value="password123" />
        <button type="submit">Sign In</button>
      </form>
    </body>
    </html>
  `);
});

router.post('/approve', (req, res) => {
  const { username, password, client_id, redirect_uri, scope, state, nonce } = req.body;
  const user = USERS[username];
  if (!user || user.password !== password) return res.status(401).send('Invalid credentials');
  const code = randomBytes(16).toString('hex');
  authCodes.set(code, { clientId: client_id, username, scope, nonce, expiresAt: Date.now() + 60_000 });
  let callbackUrl = redirect_uri + `?code=${encodeURIComponent(code)}`;
  if (state) callbackUrl += `&state=${encodeURIComponent(state)}`;
  res.redirect(callbackUrl);
});

router.post('/token', (req, res) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;
  const client = CLIENTS[client_id];
  if (!client || client.secret !== client_secret || client.redirectUri !== redirect_uri) {
    return res.status(401).json({ error: 'invalid_client' });
  }
  const entry = authCodes.get(code);
  if (!entry || entry.clientId !== client_id || entry.expiresAt < Date.now()) {
    authCodes.delete(code);
    return res.status(400).json({ error: 'invalid_grant' });
  }
  authCodes.delete(code);

  const user = USERS[entry.username];
  const accessToken = randomBytes(32).toString('hex');
  const idToken = jwt.sign(
    { sub: user.sub, name: user.name, email: user.email, nonce: entry.nonce, aud: client_id, iss: 'http://localhost:3001' },
    SECRET,
    { expiresIn: '1h', algorithm: 'HS256' }
  );
  tokens.set(accessToken, { username: entry.username, scope: entry.scope, expiresAt: Date.now() + 3600_000 });
  res.json({ access_token: accessToken, id_token: idToken, token_type: 'Bearer', expires_in: 3600 });
});

router.get('/userinfo', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Bearer token' });
  const entry = tokens.get(auth.slice(7));
  if (!entry || entry.expiresAt < Date.now()) return res.status(401).json({ error: 'Invalid or expired token' });
  const user = USERS[entry.username];
  res.json({ sub: user.sub, name: user.name, email: user.email });
});

export default router;
