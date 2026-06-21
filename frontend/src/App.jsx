import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import SessionAuth from './pages/SessionAuth';
import JWTAuth from './pages/JWTAuth';
import OAuth2 from './pages/OAuth2';
import OIDC from './pages/OIDC';
import APIKeys from './pages/APIKeys';
import BasicAuth from './pages/BasicAuth';

const NAV = [
  { to: '/', label: 'Home', exact: true },
  { to: '/session', label: 'Session' },
  { to: '/jwt', label: 'JWT' },
  { to: '/oauth2', label: 'OAuth 2.0' },
  { to: '/oidc', label: 'OIDC' },
  { to: '/apikeys', label: 'API Keys' },
  { to: '/basic', label: 'Basic Auth' },
];

function Nav() {
  return (
    <nav className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap gap-1 items-center sticky top-0 z-50">
      <span className="text-white font-bold mr-3 text-sm">Auth<span className="text-blue-400">Lab</span></span>
      {NAV.map(({ to, label, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) =>
            `px-3 py-1 rounded text-xs font-medium transition-colors ${
              isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Nav />
        <main className="max-w-7xl mx-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/session" element={<SessionAuth />} />
            <Route path="/jwt" element={<JWTAuth />} />
            <Route path="/oauth2/*" element={<OAuth2 />} />
            <Route path="/oidc/*" element={<OIDC />} />
            <Route path="/apikeys" element={<APIKeys />} />
            <Route path="/basic" element={<BasicAuth />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
