import { useState } from 'react';
import FlowDiagram from '../components/FlowDiagram';
import HttpInspector from '../components/HttpInspector';
import InfoCard from '../components/InfoCard';
import { apiFetch } from '../api';

const STEPS = [
  { from: 'Client', to: 'Server', label: 'POST /apikey/generate', detail: 'App requests an API key, providing a name/label. In production this is tied to an account after authentication.', code: 'POST /apikey/generate\n\n{ "name": "My App" }' },
  { from: 'Server', to: 'Server', label: 'Generate + store key', detail: 'Server generates a cryptographically random key and stores it with metadata (name, createdAt, active). The key is hashed before storage in real systems.', code: 'key = "ak_" + randomBytes(20).toString("hex")\nstore.set(key, { name, active: true })' },
  { from: 'Server', to: 'Client', label: '{ key } — show once', detail: 'The raw key is returned once. It should be stored securely by the client. In real systems the key is hashed and never readable again.', code: '{ "key": "ak_4f2a...", "name": "My App" }' },
  { from: 'Client', to: 'Server', label: 'GET /data + X-API-Key', detail: 'Client includes the key in the X-API-Key header (or query param, or Authorization header).', code: 'GET /apikey/data\nX-API-Key: ak_4f2a...' },
  { from: 'Server', to: 'Server', label: 'Validate key', detail: 'Server looks up the key in its store, checks it exists and is active. No tokens, no signatures — just a lookup.', code: 'const entry = keys.get(apiKey)\nif (!entry || !entry.active) → 401' },
  { from: 'Server', to: 'Client', label: '200 OK + data', detail: 'Access granted. Server updates lastUsed timestamp.', code: '{ "data": [...], "keyName": "My App" }' },
];

export default function APIKeys() {
  const [appName, setAppName] = useState('My App');
  const [apiKey, setApiKey] = useState('');
  const [req, setReq] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revoked, setRevoked] = useState(false);

  async function run(fn) { setLoading(true); try { await fn(); } finally { setLoading(false); } }

  async function generateKey() {
    await run(async () => {
      setReq({ method: 'POST', url: 'http://localhost:3001/apikey/generate', headers: { 'Content-Type': 'application/json' }, body: { name: appName } });
      const r = await apiFetch('/apikey/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: appName }) });
      setRes(r);
      if (r.ok && r.body?.key) { setApiKey(r.body.key); setRevoked(false); }
    });
  }

  async function callApi() {
    await run(async () => {
      setReq({ method: 'GET', url: 'http://localhost:3001/apikey/data', headers: { 'X-API-Key': apiKey } });
      const r = await apiFetch('/apikey/data', { headers: { 'X-API-Key': apiKey } });
      setRes(r);
    });
  }

  async function revokeKey() {
    await run(async () => {
      setReq({ method: 'POST', url: 'http://localhost:3001/apikey/revoke', headers: { 'Content-Type': 'application/json' }, body: { key: apiKey } });
      const r = await apiFetch('/apikey/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: apiKey }) });
      setRes(r);
      if (r.ok) setRevoked(true);
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">API Keys</h2>
        <p className="text-slate-400 mt-1 text-sm">Static shared secrets for machine-to-machine authentication. Simple but require careful lifecycle management.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <InfoCard title="How it works" color="yellow">
            <ol className="list-decimal list-inside space-y-1">
              <li>System generates a cryptographically random key</li>
              <li>Key stored (usually hashed) server-side with metadata</li>
              <li>Client includes key in every request via header</li>
              <li>Server looks up the key on each request</li>
              <li>Keys can be revoked instantly by deleting from store</li>
            </ol>
          </InfoCard>
          <InfoCard title="Where to put the key" color="yellow">
            <div className="font-mono text-xs space-y-1">
              <div className="text-emerald-300">X-API-Key: ak_abc123          ← most common</div>
              <div className="text-blue-300">Authorization: Bearer ak_abc123 ← also common</div>
              <div className="text-slate-500">?api_key=ak_abc123              ← avoid (logged in URLs)</div>
            </div>
          </InfoCard>
          <InfoCard title="Pros / Cons" color="yellow">
            <strong className="text-emerald-400">Pros:</strong> Simple to implement. Easy to revoke. Good for server-to-server. No OAuth complexity.<br/>
            <strong className="text-rose-400">Cons:</strong> No expiry by default. No user identity (unless tied to account). Key leaks = permanent compromise until rotated. Not suitable for browsers (can't keep secrets).
          </InfoCard>
        </div>

        <div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-4">
            <div className="text-sm font-semibold text-slate-300 mb-4">Live Demo</div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">App Name</label>
                <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={appName} onChange={e => setAppName(e.target.value)} />
              </div>
              <button onClick={generateKey} disabled={loading} className="w-full px-4 py-2.5 text-sm rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-medium transition-colors disabled:opacity-50">
                Generate API Key
              </button>

              {apiKey && (
                <div className={`rounded-lg p-3 border ${revoked ? 'bg-red-950/30 border-red-800' : 'bg-slate-800 border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Your API Key {revoked && <span className="text-red-400 ml-1">(revoked)</span>}</span>
                    <button onClick={() => navigator.clipboard?.writeText(apiKey)} className="text-xs text-blue-400 hover:text-blue-300">Copy</button>
                  </div>
                  <code className="text-xs text-yellow-300 break-all">{apiKey}</code>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={callApi} disabled={!apiKey || loading} className="flex-1 px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-50">
                  Call API
                </button>
                <button onClick={revokeKey} disabled={!apiKey || loading || revoked} className="flex-1 px-4 py-2 text-sm rounded-lg bg-red-700 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50">
                  Revoke Key
                </button>
              </div>

              {revoked && (
                <p className="text-xs text-slate-400">Key is revoked. Click "Call API" again to see 403 Forbidden.</p>
              )}
            </div>
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
