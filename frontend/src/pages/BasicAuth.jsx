import { useState } from 'react';
import FlowDiagram from '../components/FlowDiagram';
import HttpInspector from '../components/HttpInspector';
import InfoCard from '../components/InfoCard';
import { apiFetch } from '../api';

const STEPS = [
  { from: 'Client', to: 'Client', label: 'Encode credentials', detail: 'Client base64-encodes "username:password". This is NOT encryption — anyone with the token can decode it instantly.', code: 'btoa("alice:password123") → "YWxpY2U6cGFzc3dvcmQxMjM="' },
  { from: 'Client', to: 'Server', label: 'GET /basic/resource', detail: 'Client includes the encoded credentials in the Authorization header on every request.', code: 'GET /basic/resource\nAuthorization: Basic YWxpY2U6cGFzc3dvcmQxMjM=' },
  { from: 'Server', to: 'Server', label: 'Decode + validate', detail: 'Server base64-decodes the header, splits on ":", and validates against stored credentials.', code: 'atob("YWxpY2U6...") → "alice:password123"\nconst [user, pass] = decoded.split(":")' },
  { from: 'Server', to: 'Client', label: '200 OK + resource', detail: 'Credentials valid — server returns the resource.', code: '{ "message": "Access granted", "user": "alice" }' },
  { from: 'Server', to: 'Client', label: '401 + WWW-Authenticate', detail: 'If credentials are wrong or missing, server responds with 401 and a WWW-Authenticate header that tells clients what auth scheme to use.', code: 'HTTP/1.1 401 Unauthorized\nWWW-Authenticate: Basic realm="Demo"' },
];

export default function BasicAuth() {
  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('password123');
  const [req, setReq] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  const encoded = btoa(`${username}:${password}`);

  async function sendRequest() {
    setLoading(true);
    try {
      const authHeader = `Basic ${encoded}`;
      setReq({ method: 'GET', url: 'http://localhost:3001/basic/resource', headers: { Authorization: authHeader } });
      const r = await apiFetch('/basic/resource', { headers: { Authorization: authHeader } });
      setRes(r);
    } finally { setLoading(false); }
  }

  async function sendNoAuth() {
    setLoading(true);
    try {
      setReq({ method: 'GET', url: 'http://localhost:3001/basic/resource', headers: {} });
      const r = await apiFetch('/basic/resource');
      setRes(r);
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">HTTP Basic Authentication</h2>
        <p className="text-slate-400 mt-1 text-sm">Credentials base64-encoded in every request. Simple but insecure without HTTPS.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <InfoCard title="How it works" color="rose">
            <ol className="list-decimal list-inside space-y-1">
              <li>Concatenate <code className="bg-slate-700 px-1 rounded text-xs">username:password</code></li>
              <li>Base64-encode the string</li>
              <li>Send as <code className="bg-slate-700 px-1 rounded text-xs">Authorization: Basic &lt;encoded&gt;</code></li>
              <li>Server decodes and validates credentials on every request</li>
            </ol>
          </InfoCard>
          <InfoCard title="Critical Warning" color="rose">
            Base64 is <strong className="text-red-400">not encryption</strong> — it's just encoding. Anyone who intercepts the header can decode it in milliseconds. Basic Auth is only safe over <strong className="text-white">HTTPS</strong>.
          </InfoCard>
          <InfoCard title="Pros / Cons" color="rose">
            <strong className="text-emerald-400">Pros:</strong> Extremely simple. Supported everywhere. No tokens to manage. Good for internal tools and scripts.<br/>
            <strong className="text-rose-400">Cons:</strong> Credentials sent on every request. No sessions — can't "logout" without closing the browser. No token expiry. Requires HTTPS.
          </InfoCard>
        </div>

        <div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-4">
            <div className="text-sm font-semibold text-slate-300 mb-4">Live Demo</div>

            <div className="space-y-2 mb-4">
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {/* Live encoding preview */}
            <div className="bg-slate-800 rounded-lg p-3 mb-4 font-mono text-xs space-y-1.5">
              <div>
                <span className="text-slate-400">Raw: </span>
                <span className="text-yellow-300">{username}:{password}</span>
              </div>
              <div>
                <span className="text-slate-400">btoa(): </span>
                <span className="text-emerald-300 break-all">{encoded}</span>
              </div>
              <div>
                <span className="text-slate-400">Header: </span>
                <span className="text-blue-300">Authorization: Basic {encoded}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={sendRequest} disabled={loading} className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors disabled:opacity-50">
                Send Request
              </button>
              <button onClick={sendNoAuth} disabled={loading} className="flex-1 px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-50">
                No Auth →
              </button>
            </div>
          </div>

          <HttpInspector request={req} response={res} loading={loading} />

          <div className="mt-4 bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Try This</div>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>Try wrong password → see 401</li>
              <li>Decode the encoded value: <code className="bg-slate-800 text-xs px-1 rounded">atob("{encoded.slice(0, 12)}...")</code></li>
              <li>Try "No Auth" → see WWW-Authenticate header in response</li>
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
