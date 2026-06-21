import { useState } from 'react';
import FlowDiagram from '../components/FlowDiagram';
import HttpInspector from '../components/HttpInspector';
import InfoCard from '../components/InfoCard';
import { apiFetch } from '../api';

const STEPS = [
  { from: 'Client', to: 'Server', label: 'POST /session/login', detail: 'Client sends username + password in the request body.', code: 'POST /session/login\nContent-Type: application/json\n\n{ "username": "alice", "password": "password123" }' },
  { from: 'Server', to: 'Client', label: '200 OK + Set-Cookie', detail: 'Server creates a session in memory, assigns a session ID, and sends it back via Set-Cookie header.', code: 'HTTP/1.1 200 OK\nSet-Cookie: connect.sid=s%3A...; HttpOnly; SameSite=Lax' },
  { from: 'Client', to: 'Server', label: 'GET /session/profile (Cookie)', detail: 'Browser automatically attaches the cookie to every subsequent request.', code: 'GET /session/profile\nCookie: connect.sid=s%3A...' },
  { from: 'Server', to: 'Server', label: 'Lookup session store', detail: 'Server extracts the session ID from the cookie and looks it up in the session store (memory/Redis/DB).', code: 'sessions["abc123"] → { user: "alice", role: "admin" }' },
  { from: 'Server', to: 'Client', label: '200 OK + user data', detail: 'Server returns the user profile from the session.', code: 'HTTP/1.1 200 OK\n\n{ "user": { "username": "alice", "role": "admin" } }' },
  { from: 'Client', to: 'Server', label: 'POST /session/logout', detail: 'Client sends a logout request. Server destroys the session and clears the cookie.', code: 'POST /session/logout\nCookie: connect.sid=s%3A...' },
  { from: 'Server', to: 'Client', label: 'Session destroyed', detail: 'Server deletes the session from the store and tells the browser to clear the cookie.', code: 'HTTP/1.1 200 OK\nSet-Cookie: connect.sid=; Expires=Thu, 01 Jan 1970 00:00:00 GMT' },
];

export default function SessionAuth() {
  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('password123');
  const [req, setReq] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  async function run(fn) {
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  }

  async function login() {
    await run(async () => {
      setReq({ method: 'POST', url: 'http://localhost:3001/session/login', headers: { 'Content-Type': 'application/json' }, body: { username, password } });
      const r = await apiFetch('/session/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      setRes(r);
      if (r.ok) setLoggedIn(true);
    });
  }

  async function getProfile() {
    await run(async () => {
      setReq({ method: 'GET', url: 'http://localhost:3001/session/profile', headers: { Cookie: '(auto-attached by browser)' } });
      const r = await apiFetch('/session/profile');
      setRes(r);
    });
  }

  async function logout() {
    await run(async () => {
      setReq({ method: 'POST', url: 'http://localhost:3001/session/logout', headers: { Cookie: '(auto-attached by browser)' } });
      const r = await apiFetch('/session/logout', { method: 'POST' });
      setRes(r);
      if (r.ok) setLoggedIn(false);
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Session / Cookie Authentication</h2>
        <p className="text-slate-400 mt-1 text-sm">The server stores session state. The browser holds only a session ID in a cookie.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Theory + Flow */}
        <div>
          <InfoCard title="How it works" color="blue">
            <ol className="list-decimal list-inside space-y-1">
              <li>User logs in with credentials</li>
              <li>Server creates a session and stores it in memory (or Redis)</li>
              <li>Server sends a <code className="bg-slate-700 px-1 rounded text-xs">Set-Cookie</code> header with the session ID</li>
              <li>Browser sends the cookie automatically on every request</li>
              <li>Server looks up the session ID to authenticate</li>
              <li>Logout destroys the session server-side</li>
            </ol>
          </InfoCard>
          <InfoCard title="Pros" color="emerald">
            Easy to revoke (just delete from store). Works well with server-rendered apps. Session data lives on the server so it can be updated without reissuing tokens.
          </InfoCard>
          <InfoCard title="Cons" color="rose">
            Stateful — server must store sessions. Harder to scale horizontally without a shared store (Redis). Vulnerable to CSRF if not protected. Cookie theft = session hijack.
          </InfoCard>
        </div>

        {/* Right: Live Demo */}
        <div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-4">
            <div className="text-sm font-semibold text-slate-300 mb-4">Live Demo</div>

            <div className={`text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-4 ${loggedIn ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
              <span className={`w-2 h-2 rounded-full ${loggedIn ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              {loggedIn ? 'Session active' : 'Not logged in'}
            </div>

            <div className="space-y-2 mb-4">
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={login} disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50">Login</button>
              <button onClick={getProfile} disabled={loading || !loggedIn} className="px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-50">Get Profile</button>
              <button onClick={logout} disabled={loading || !loggedIn} className="px-4 py-2 text-sm rounded-lg bg-red-700 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50">Logout</button>
            </div>
          </div>

          <HttpInspector request={req} response={res} loading={loading} />

          <div className="mt-4 bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Try This</div>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>1. Login → check Response for <code className="bg-slate-800 text-xs px-1 rounded">set-cookie</code></li>
              <li>2. Click Get Profile → cookie auto-sent, session validated</li>
              <li>3. Logout → session destroyed</li>
              <li>4. Click Get Profile again → 401 Unauthorized</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10 max-w-4xl mx-auto">
        <div className="text-xs text-slate-400 uppercase tracking-widest mb-3 text-center">Flow Diagram</div>
        <FlowDiagram steps={STEPS} actors={['Client', 'Server']} />
      </div>
    </div>
  );
}
