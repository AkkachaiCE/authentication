import { useState } from 'react';
import FlowDiagram from '../components/FlowDiagram';
import HttpInspector from '../components/HttpInspector';
import InfoCard from '../components/InfoCard';
import { apiFetch } from '../api';

const STEPS = [
  { from: 'Client', to: 'Server', label: 'POST /jwt/login', detail: 'Client sends credentials. Server does NOT create any session.', code: 'POST /jwt/login\n\n{ "username": "alice", "password": "password123" }' },
  { from: 'Server', to: 'Server', label: 'Sign JWT', detail: 'Server creates a JWT with header.payload.signature. The signature is an HMAC-SHA256 of the header+payload using a secret key only the server knows.', code: 'header:  { "alg": "HS256", "typ": "JWT" }\npayload: { "sub": "alice", "role": "admin", "exp": ... }\nsig:     HMAC-SHA256(base64(header)+"."+base64(payload), secret)' },
  { from: 'Server', to: 'Client', label: '200 OK + { token }', detail: 'Server returns the JWT. No server-side state is stored.', code: '{ "token": "eyJhbGci..." }' },
  { from: 'Client', to: 'Client', label: 'Store token', detail: 'Client stores the JWT (localStorage, sessionStorage, or memory). Important: avoid localStorage if XSS is a concern — prefer httpOnly cookies.', code: 'localStorage.setItem("token", jwt)' },
  { from: 'Client', to: 'Server', label: 'GET /jwt/profile + Bearer', detail: 'Client sends the JWT in the Authorization header on every request.', code: 'GET /jwt/profile\nAuthorization: Bearer eyJhbGci...' },
  { from: 'Server', to: 'Server', label: 'Verify signature', detail: 'Server re-computes the HMAC using its secret key and compares to the token signature. If it matches, the payload is authentic. No database lookup needed.', code: 'jwt.verify(token, SECRET) → payload' },
  { from: 'Server', to: 'Client', label: '200 OK + user data', detail: 'Server responds with data. The token can be used until it expires.', code: '{ "user": { "sub": "alice", "role": "admin" } }' },
];

function decodeJwt(token) {
  try {
    const [header, payload] = token.split('.').slice(0, 2).map(p => JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))));
    return { header, payload };
  } catch { return null; }
}

export default function JWTAuth() {
  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('password123');
  const [token, setToken] = useState('');
  const [req, setReq] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tamperedToken, setTamperedToken] = useState('');

  async function run(fn) { setLoading(true); try { await fn(); } finally { setLoading(false); } }

  async function login() {
    await run(async () => {
      setReq({ method: 'POST', url: 'http://localhost:3001/jwt/login', headers: { 'Content-Type': 'application/json' }, body: { username, password } });
      const r = await apiFetch('/jwt/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      setRes(r);
      if (r.ok && r.body?.token) { setToken(r.body.token); setTamperedToken(r.body.token); }
    });
  }

  async function getProfile(useToken = token) {
    await run(async () => {
      setReq({ method: 'GET', url: 'http://localhost:3001/jwt/profile', headers: { Authorization: `Bearer ${useToken}` } });
      const r = await apiFetch('/jwt/profile', { headers: { Authorization: `Bearer ${useToken}` } });
      setRes(r);
    });
  }

  const decoded = decodeJwt(token);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">JWT — JSON Web Tokens</h2>
        <p className="text-slate-400 mt-1 text-sm">Stateless tokens signed by the server. No session storage needed on the server.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <InfoCard title="How it works" color="emerald">
            <ol className="list-decimal list-inside space-y-1">
              <li>User logs in — server signs a JWT with a secret key</li>
              <li>JWT returned to client: <code className="bg-slate-700 px-1 rounded text-xs">header.payload.signature</code></li>
              <li>Client stores token and sends it in <code className="bg-slate-700 px-1 rounded text-xs">Authorization: Bearer</code></li>
              <li>Server verifies the signature — no DB lookup needed</li>
              <li>Token expires automatically (self-contained <code className="bg-slate-700 px-1 rounded text-xs">exp</code> claim)</li>
            </ol>
          </InfoCard>
          <InfoCard title="JWT Structure" color="yellow">
            <code className="text-xs break-all">
              <span className="text-red-400">eyJhbGciOiJIUzI1NiJ9</span>
              <span className="text-slate-400">.</span>
              <span className="text-purple-400">eyJzdWIiOiJhbGljZSJ9</span>
              <span className="text-slate-400">.</span>
              <span className="text-blue-400">SflKxwRJSMeKKF2QT4...</span>
            </code>
            <div className="mt-2 text-xs space-y-0.5">
              <div><span className="text-red-400">Header</span> — algorithm + type</div>
              <div><span className="text-purple-400">Payload</span> — claims (sub, role, exp…)</div>
              <div><span className="text-blue-400">Signature</span> — HMAC(header+payload, secret)</div>
            </div>
          </InfoCard>
          <InfoCard title="Pros / Cons" color="orange">
            <strong className="text-emerald-400">Pros:</strong> Stateless, scales horizontally, works across microservices.<br/>
            <strong className="text-rose-400">Cons:</strong> Cannot revoke before expiry. Payload is base64 only — not encrypted. Token theft = impersonation until expiry.
          </InfoCard>
        </div>

        <div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-4">
            <div className="text-sm font-semibold text-slate-300 mb-4">Live Demo</div>
            <div className="space-y-2 mb-4">
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={login} disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50">Login</button>
              <button onClick={() => getProfile(token)} disabled={loading || !token} className="px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium disabled:opacity-50">Get Profile</button>
            </div>

            {token && decoded && (
              <div className="space-y-3">
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Decoded Header</div>
                  <pre className="text-xs text-red-300">{JSON.stringify(decoded.header, null, 2)}</pre>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Decoded Payload</div>
                  <pre className="text-xs text-purple-300">{JSON.stringify(decoded.payload, null, 2)}</pre>
                  <div className="text-xs text-slate-500 mt-1">exp: {new Date(decoded.payload.exp * 1000).toLocaleTimeString()}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-1">Tamper with token (edit then send):</div>
                  <textarea
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-yellow-300 font-mono resize-none"
                    rows={3}
                    value={tamperedToken}
                    onChange={e => setTamperedToken(e.target.value)}
                  />
                  <button onClick={() => getProfile(tamperedToken)} disabled={loading} className="mt-1 px-3 py-1.5 text-xs rounded bg-yellow-700 hover:bg-yellow-600 text-white disabled:opacity-50">Send Tampered Token →</button>
                </div>
              </div>
            )}
          </div>

          <HttpInspector request={req} response={res} loading={loading} />
        </div>
      </div>

      <div className="mt-10 max-w-4xl mx-auto">
        <div className="text-xs text-slate-400 uppercase tracking-widest mb-3 text-center">Flow Diagram</div>
        <FlowDiagram steps={STEPS} actors={['Client', 'Server']} />
      </div>
    </div>
  );
}
