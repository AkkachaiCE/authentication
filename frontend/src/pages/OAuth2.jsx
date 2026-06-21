import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FlowDiagram from '../components/FlowDiagram';
import HttpInspector from '../components/HttpInspector';
import InfoCard from '../components/InfoCard';
import { apiFetch } from '../api';

const STEPS = [
  { from: 'Client', to: 'AuthServer', label: 'Redirect to /authorize', detail: 'App redirects user to the Authorization Server with client_id, redirect_uri, scope, and a random state value (for CSRF protection).', code: 'GET /oauth2/authorize\n  ?client_id=demo-client\n  &redirect_uri=http://localhost:5173/#/oauth2/callback\n  &response_type=code\n  &scope=read\n  &state=xyz123' },
  { from: 'AuthServer', to: 'Client', label: 'Login page shown', detail: 'Auth server shows its own login page. The app never sees the user\'s password.' },
  { from: 'Client', to: 'AuthServer', label: 'User approves', detail: 'User authenticates and clicks "Approve". Auth server validates credentials.' },
  { from: 'AuthServer', to: 'Client', label: 'Redirect with ?code=', detail: 'Auth server redirects back to redirect_uri with a short-lived authorization code (valid ~60s). State is echoed back for CSRF check.', code: 'GET /callback?code=abc123&state=xyz123' },
  { from: 'Client', to: 'AuthServer', label: 'POST /token (code exchange)', detail: 'App\'s backend exchanges the code for tokens. Sends client_secret — this must happen server-to-server, not in the browser.', code: 'POST /oauth2/token\n\nclient_id=demo-client\nclient_secret=demo-secret\ngrant_type=authorization_code\ncode=abc123\nredirect_uri=...' },
  { from: 'AuthServer', to: 'Client', label: '{ access_token }', detail: 'Auth server returns an access token. Code is consumed and cannot be reused.', code: '{ "access_token": "a1b2...", "token_type": "Bearer", "expires_in": 3600 }' },
  { from: 'Client', to: 'Server', label: 'GET /resource + Bearer', detail: 'App uses the access token to call the Resource Server (API) on behalf of the user.', code: 'GET /oauth2/resource\nAuthorization: Bearer a1b2...' },
  { from: 'Server', to: 'Client', label: '200 OK + data', detail: 'Resource server validates the token and returns the requested data.', code: '{ "user": { "name": "Alice" }, "scope": "read" }' },
];

const CLIENT_ID = 'demo-client';
const CLIENT_SECRET = 'demo-secret';
const REDIRECT_URI = 'http://localhost:5173/#/oauth2/callback';

export default function OAuth2() {
  const location = useLocation();
  const [code, setCode] = useState('');
  const [state] = useState('state_' + Math.random().toString(36).slice(2, 8));
  const [accessToken, setAccessToken] = useState('');
  const [req, setReq] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('idle'); // idle | redirected | got_code | got_token

  // Pick up ?code= from callback redirect
  useEffect(() => {
    if (!location.pathname.includes('/oauth2/callback')) return;
    // Code is appended to the hash fragment: #/oauth2/callback?code=...
    const hashQuery = window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(hashQuery);
    const c = params.get('code');
    if (c) { setCode(c); setStep('got_code'); }
  }, [location.pathname]);

  async function run(fn) { setLoading(true); try { await fn(); } finally { setLoading(false); } }

  function startAuth() {
    const params = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: 'code', scope: 'read', state });
    setStep('redirected');
    window.location.href = `http://localhost:3001/oauth2/authorize?${params}`;
  }

  async function exchangeCode() {
    await run(async () => {
      const body = new URLSearchParams({ grant_type: 'authorization_code', code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT_URI });
      setReq({ method: 'POST', url: 'http://localhost:3001/oauth2/token', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: Object.fromEntries(body) });
      const r = await apiFetch('/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      setRes(r);
      if (r.ok && r.body?.access_token) { setAccessToken(r.body.access_token); setStep('got_token'); }
    });
  }

  async function getResource() {
    await run(async () => {
      setReq({ method: 'GET', url: 'http://localhost:3001/oauth2/resource', headers: { Authorization: `Bearer ${accessToken}` } });
      const r = await apiFetch('/oauth2/resource', { headers: { Authorization: `Bearer ${accessToken}` } });
      setRes(r);
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">OAuth 2.0 — Authorization Code Flow</h2>
        <p className="text-slate-400 mt-1 text-sm">Delegated authorization. The app never sees the user's password — the Auth Server handles login.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <InfoCard title="Key Concept" color="orange">
            OAuth 2.0 is about <strong className="text-white">authorization</strong> (access), not authentication (identity). The app requests permission to act on the user's behalf. The user approves at the Auth Server — the app only gets a token, never the password.
          </InfoCard>
          <InfoCard title="Authorization Code Flow" color="yellow">
            The most secure OAuth flow. The <code className="bg-slate-700 px-1 rounded text-xs">code</code> is short-lived and exchanged server-to-server. The <code className="bg-slate-700 px-1 rounded text-xs">client_secret</code> never touches the browser.
          </InfoCard>
          <InfoCard title="Pros / Cons" color="orange">
            <strong className="text-emerald-400">Pros:</strong> User password never shared with app. Scoped access. Tokens can be revoked. Works across apps and services.<br/>
            <strong className="text-rose-400">Cons:</strong> Complex multi-step flow. Requires a backend to keep client_secret safe. PKCE required for SPAs.
          </InfoCard>
        </div>

        <div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-4">
            <div className="text-sm font-semibold text-slate-300 mb-4">Live Demo</div>

            {/* Step indicators */}
            {['Step 1: Get Auth Code', 'Step 2: Exchange Code for Token', 'Step 3: Access Resource'].map((s, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs mb-2 ${step === ['idle','got_code','got_token'][i] || (i === 0 && step === 'redirected') ? 'text-white' : 'text-slate-500'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold border ${step === ['idle','got_code','got_token'][i] ? 'border-orange-400 bg-orange-900/50 text-orange-300' : 'border-slate-700 bg-slate-800'}`}>{i + 1}</span>
                {s}
              </div>
            ))}

            <div className="mt-4 space-y-3">
              <button onClick={startAuth} className="w-full px-4 py-2.5 text-sm rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition-colors">
                Login with Mock Provider →
              </button>

              {code && (
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Authorization Code received:</div>
                  <code className="text-xs text-yellow-300 break-all">{code}</code>
                </div>
              )}

              <button onClick={exchangeCode} disabled={!code || loading} className="w-full px-4 py-2.5 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-40">
                Exchange Code for Access Token
              </button>

              {accessToken && (
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Access Token:</div>
                  <code className="text-xs text-emerald-300 break-all">{accessToken.slice(0, 20)}...</code>
                </div>
              )}

              <button onClick={getResource} disabled={!accessToken || loading} className="w-full px-4 py-2.5 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-40">
                Access Protected Resource
              </button>

              <button onClick={() => { setCode(''); setAccessToken(''); setStep('idle'); setReq(null); setRes(null); }} className="w-full px-4 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
                Reset
              </button>
            </div>
          </div>

          <HttpInspector request={req} response={res} loading={loading} />
        </div>
      </div>

      <div className="mt-10 max-w-4xl mx-auto">
        <div className="text-xs text-slate-400 uppercase tracking-widest mb-3 text-center">Flow Diagram</div>
        <FlowDiagram steps={STEPS} actors={['Client', 'AuthServer', 'Server']} />
      </div>
    </div>
  );
}
