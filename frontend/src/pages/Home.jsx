import { Link } from 'react-router-dom';

const METHODS = [
  { to: '/session', label: 'Session / Cookie', color: 'blue', icon: '🍪',
    desc: 'Server stores session state. Cookie holds session ID. Classic and battle-tested.' },
  { to: '/jwt', label: 'JWT', color: 'emerald', icon: '🔑',
    desc: 'Stateless tokens signed by the server. Client stores and sends the token each request.' },
  { to: '/oauth2', label: 'OAuth 2.0', color: 'orange', icon: '🔐',
    desc: 'Delegated authorization. Let users log in with third-party providers like Google or GitHub.' },
  { to: '/oidc', label: 'OpenID Connect', color: 'purple', icon: '🪪',
    desc: 'Identity layer on top of OAuth 2.0. Adds a signed ID token with verified user claims.' },
  { to: '/apikeys', label: 'API Keys', color: 'yellow', icon: '🗝️',
    desc: 'Static shared secrets for machine-to-machine auth. Simple but require careful management.' },
  { to: '/basic', label: 'Basic Auth', color: 'rose', icon: '🔒',
    desc: 'Username and password base64-encoded in every HTTP request header.' },
];

const COLORS = {
  blue: 'border-blue-500/40 hover:border-blue-400 hover:bg-blue-950/30',
  emerald: 'border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/30',
  orange: 'border-orange-500/40 hover:border-orange-400 hover:bg-orange-950/30',
  purple: 'border-purple-500/40 hover:border-purple-400 hover:bg-purple-950/30',
  yellow: 'border-yellow-500/40 hover:border-yellow-400 hover:bg-yellow-950/30',
  rose: 'border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/30',
};

const BADGE = {
  blue: 'bg-blue-900/50 text-blue-300',
  emerald: 'bg-emerald-900/50 text-emerald-300',
  orange: 'bg-orange-900/50 text-orange-300',
  purple: 'bg-purple-900/50 text-purple-300',
  yellow: 'bg-yellow-900/50 text-yellow-300',
  rose: 'bg-rose-900/50 text-rose-300',
};

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">Authentication Methods</h1>
        <p className="text-slate-400 text-lg">Interactive demos with animated flow diagrams and live HTTP inspection</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {METHODS.map(({ to, label, color, icon, desc }) => (
          <Link
            key={to}
            to={to}
            className={`block bg-slate-900 border rounded-xl p-5 transition-all duration-200 ${COLORS[color]}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{icon}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE[color]}`}>{label}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
              Flow diagram + live demo <span className="ml-auto">→</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Demo Credentials</div>
        <div className="grid grid-cols-2 gap-3 text-sm font-mono">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">Username</div>
            <div className="text-emerald-300">alice / bob</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">Password</div>
            <div className="text-emerald-300">password123 / secret</div>
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-3">Backend runs on <code className="text-slate-300">http://localhost:3001</code> — make sure it's running before trying live demos.</p>
      </div>
    </div>
  );
}
