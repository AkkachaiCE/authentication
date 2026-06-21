import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FlowDiagram from '../components/FlowDiagram';
import HttpInspector from '../components/HttpInspector';
import InfoCard from '../components/InfoCard';
import { apiFetch } from '../api';

const STEPS = [
  { from: 'Client', to: 'AuthServer', label: 'Redirect + scope=openid', detail: 'Same as OAuth 2.0, but scope must include "openid". A nonce is included to bind the ID token to this session.', code: 'GET /oidc/authorize\n  ?scope=openid profile email\n  &nonce=abc123\n  &response_type=code\n  ...' },
  { from: 'AuthServer', to: 'Client', label: 'User authenticates', detail: 'User logs in at the Identity Provider (IdP). The IdP verifies identity.' },
  { from: 'AuthServer', to: 'Client', label: 'Redirect with code', detail: 'Same as OAuth 2.0 — authorization code returned in the redirect URI.' },
  { from: 'Client', to: 'AuthServer', label: 'Exchange code for tokens', detail: 'POST to token endpoint. Returns BOTH access_token and id_token.', code: 'POST /oidc/token\ngrant_type=authorization_code&code=...' },
  { from: 'AuthServer', to: 'Client', label: 'access_token + id_token', detail: 'id_token is a signed JWT containing the user\'s identity. access_token is used to call APIs.', code: '{\n  "access_token": "...",\n  "id_token": "eyJhbGci..."\n}' },
  { from: 'Client', to: 'Client', label: 'Verify + decode id_token', detail: 'Client verifies the id_token signature and nonce, then reads the user\'s identity (sub, email, name) from the payload.', code: 'id_token payload: { sub, name, email, iss, aud, nonce }' },
  { from: 'Client', to: 'AuthServer', label: 'GET /userinfo (optional)', detail: 'Client can also fetch latest user info from the /userinfo endpoint using the access token.', code: 'GET /oidc/userinfo\nAuthorization: Bearer <access_token>' },
  { from: 'AuthServer', to: 'Client', label: '{ sub, name, email }', detail: 'UserInfo endpoint returns the authenticated user\'s profile claims.' },
];

const CLIENT_ID = 'oidc-client';
const CLIENT_SECRET = 'oidc-secret';
const REDIRECT_URI = 'http://localhost:5173/#/oidc/callback';

function decodeJwt(token) {
  try {
    const [header, payload] = token.split('.').slice(0, 2).map(p => JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))));
    return { header, payload };
  } catch { return null; }
}

export default function OIDC() {
  const location = useLocation();
  const nonce = useState('nonce_' + Math.random().toString(36).slice(2, 8))[0];
  const [code, setCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [idToken, setIdToken] = useState('');
  const [req, setReq] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location.pathname.includes('/oidc/callback')) return;
    const hashQuery = window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(hashQuery);
    const c = params.get('code');
    if (c) setCode(c);
  }, [location.pathname]);

  async function run(fn) { setLoading(true); try { await fn(); } finally { setLoading(false); } }

  function startAuth() {
    const params = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: 'code', scope: 'openid profile email', state: 'state_abc', nonce });
    window.location.href = `http://localhost:3001/oidc/authorize?${params}`;
  }

  async function exchangeCode() {
    await run(async () => {
      const body = new URLSearchParams({ grant_type: 'authorization_code', code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT_URI });
      setReq({ method: 'POST', url: 'http://localhost:3001/oidc/token', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: Object.fromEntries(body) });
      const r = await apiFetch('/oidc/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      setRes(r);
      if (r.ok) { setAccessToken(r.body?.access_token || ''); setIdToken(r.body?.id_token || ''); }
    });
  }

  async function getUserInfo() {
    await run(async () => {
      setReq({ method: 'GET', url: 'http://localhost:3001/oidc/userinfo', headers: { Authorization: `Bearer ${accessToken}` } });
      const r = await apiFetch('/oidc/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
      setRes(r);
    });
  }

  const decoded = idToken ? decodeJwt(idToken) : null;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">OpenID Connect (OIDC)</h2>
        <p className="text-slate-400 mt-1 text-sm">Identity layer on top of OAuth 2.0. Adds a signed ID token that proves who the user is.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <InfoCard title="OAuth 2.0 vs OIDC" color="purple">
            <strong className="text-orange-300">OAuth 2.0</strong> answers: "Can this app access this resource?" (authorization)<br/><br/>
            <strong className="text-purple-300">OIDC</strong> answers: "Who is this user?" (authentication)<br/><br/>
            OIDC adds an <code className="bg-slate-700 px-1 rounded text-xs">id_token</code> — a signed JWT containing verified identity claims about the user.
          </InfoCard>
          <InfoCard title="ID Token Claims" color="purple">
            <div className="font-mono text-xs space-y-0.5">
              <div><span className="text-blue-300">sub</span> — unique user ID (never changes)</div>
              <div><span className="text-blue-300">name / email</span> — profile info</div>
              <div><span className="text-blue-300">iss</span> — issuer (who created this token)</div>
              <div><span className="text-blue-300">aud</span> — audience (which client this is for)</div>
              <div><span className="text-blue-300">nonce</span> — replay attack prevention</div>
              <div><span className="text-blue-300">iat / exp</span> — issued at / expiry</div>
            </div>
          </InfoCard>
          <InfoCard title="Pros / Cons" color="purple">
            <strong className="text-emerald-400">Pros:</strong> Standardized identity — know exactly who the user is. Single Sign-On (SSO) across apps. Widely supported.<br/>
            <strong className="text-rose-400">Cons:</strong> More complex than plain OAuth. Token verification requires careful nonce + iss + aud checking to prevent attacks.
          </InfoCard>
        </div>

        <div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-4">
            <div className="text-sm font-semibold text-slate-300 mb-4">Live Demo</div>
            <div className="space-y-3">
              <button onClick={startAuth} className="w-full px-4 py-2.5 text-sm rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors">
                Sign In with Mock OIDC Provider →
              </button>

              {code && (
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Authorization Code:</div>
                  <code className="text-xs text-yellow-300 break-all">{code}</code>
                </div>
              )}

              <button onClick={exchangeCode} disabled={!code || loading} className="w-full px-4 py-2.5 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-40">
                Exchange Code for Tokens
              </button>

              {idToken && decoded && (
                <div className="space-y-2">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-purple-400 font-semibold mb-1">ID Token — Decoded Payload</div>
                    <pre className="text-xs text-purple-300 overflow-auto">{JSON.stringify(decoded.payload, null, 2)}</pre>
                  </div>
                  <div className="text-xs text-slate-500">access_token: {accessToken.slice(0, 16)}...</div>
                </div>
              )}

              <button onClick={getUserInfo} disabled={!accessToken || loading} className="w-full px-4 py-2.5 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-40">
                Fetch /userinfo
              </button>

              <button onClick={() => { setCode(''); setAccessToken(''); setIdToken(''); setReq(null); setRes(null); }} className="w-full px-4 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
                Reset
              </button>
            </div>
          </div>

          <HttpInspector request={req} response={res} loading={loading} />
        </div>
      </div>

      <div className="mt-10 max-w-4xl mx-auto">
        <div className="text-xs text-slate-400 uppercase tracking-widest mb-3 text-center">Flow Diagram</div>
        <FlowDiagram steps={STEPS} actors={['Client', 'AuthServer']} />
      </div>
    </div>
  );
}
