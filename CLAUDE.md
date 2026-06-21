# Auth Learning App

## Purpose
Interactive web app for learning 6 authentication methods through animated flow diagrams and live HTTP demos. Each page has a theory panel, a working live demo, and a step-by-step sequence diagram with a side explanation panel.

## Tech Stack
- **Frontend**: Vite + React 18, React Router v6 (hash routing), Tailwind CSS v3, Framer Motion
- **Backend**: Node.js 18+, Express 4, express-session, jsonwebtoken, bcryptjs, uuid
- **No database** — all state is in-memory (sessions, API keys, OAuth codes/tokens reset on restart)

## Running

```bash
# Terminal 1
cd backend && npm install && node src/index.js   # → http://localhost:3001

# Terminal 2
cd frontend && npm install && npm run dev         # → http://localhost:5173
```

## Project Layout

```
authentication/
├── backend/
│   └── src/
│       ├── index.js              # Express app: CORS, cookie-parser, express-session, mounts all routes
│       └── routes/
│           ├── session.js        # POST /session/login, GET /session/profile, POST /session/logout
│           ├── jwt.js            # POST /jwt/login, GET /jwt/profile (Authorization: Bearer)
│           ├── oauth2.js         # Full mock OAuth2 Authorization Server + resource endpoint
│           ├── oidc.js           # Mock OIDC provider (extends OAuth2 with id_token JWT)
│           ├── apikey.js         # POST /apikey/generate, GET /apikey/data, POST /apikey/revoke
│           └── basic.js          # GET /basic/resource (Authorization: Basic)
└── frontend/
    └── src/
        ├── App.jsx               # HashRouter + Nav + Routes
        ├── api.js                # apiFetch(path, options) → {status, statusText, headers, body, ok}
        ├── index.css             # Tailwind directives only
        ├── components/
        │   ├── FlowDiagram.jsx   # Animated sequence diagram: actors + arrows + side explanation panel
        │   ├── HttpInspector.jsx # Live request/response viewer with JSON syntax highlighting
        │   └── InfoCard.jsx      # Colored info box used in theory panels
        └── pages/
            ├── Home.jsx          # Overview grid linking to all 6 auth methods
            ├── SessionAuth.jsx   # Session/Cookie auth page
            ├── JWTAuth.jsx       # JWT page with live token decode + tamper demo
            ├── OAuth2.jsx        # OAuth 2.0 Authorization Code Flow (real redirect to mock server)
            ├── OIDC.jsx          # OpenID Connect (same flow + id_token decode)
            ├── APIKeys.jsx       # API key generation, usage, revocation
            └── BasicAuth.jsx     # Basic Auth with live base64 encode preview
```

## Page Layout Pattern

Every auth page follows this structure:
```
┌─────────────────────────────────────┐
│  Header: title + subtitle           │
├──────────────────┬──────────────────┤
│  Theory (InfoCards)│  Live Demo     │
│                  │  HttpInspector   │
├──────────────────┴──────────────────┤
│  FlowDiagram (full width, centered, max-w-4xl mx-auto)  │
│  [diagram left] [explanation right]                      │
└──────────────────────────────────────────────────────────┘
```

## Key Component: FlowDiagram

`FlowDiagram` takes:
- `steps` — array of `{ from, to, label, detail, code? }`
  - `from` / `to` are actor names: `'Client'`, `'Server'`, `'AuthServer'`
- `actors` — array of actor names to render as columns (e.g. `['Client', 'Server']` or `['Client', 'AuthServer', 'Server']`)

Controls: Play All / Pause / Next / Prev / Reset. Active step animates the arrow and shows detail + optional code snippet in the right panel.

## Key Component: HttpInspector

`HttpInspector` takes:
- `request` — `{ method, url, headers, body? }`
- `response` — `{ status, statusText, headers, body? }`
- `loading` — boolean

Shows Request / Response tabs. JSON values are syntax-highlighted recursively.

## OAuth2 / OIDC Redirect Handling

Both OAuth2 and OIDC use hash-based redirect URIs:
- OAuth2 callback: `http://localhost:5173/#/oauth2/callback`
- OIDC callback: `http://localhost:5173/#/oidc/callback`

The backend **appends** `?code=` directly to the redirect URI string (not via `URL.searchParams`) so that query params land inside the hash fragment. The frontend reads them from `window.location.hash.split('?')[1]`.

## Demo Credentials

| Username | Password     | Role  |
|----------|-------------|-------|
| alice    | password123 | admin |
| bob      | secret      | user  |

OAuth2/OIDC mock login is pre-filled with alice's credentials.

## What's Implemented

- [x] Session/Cookie auth — full login/profile/logout with real cookies
- [x] JWT — login, decode, tamper demo, expiry display
- [x] OAuth 2.0 — Authorization Code Flow with working mock auth server
- [x] OpenID Connect — extends OAuth2 mock, returns signed id_token
- [x] API Keys — generate, use, revoke with in-memory store
- [x] Basic Auth — live base64 encode preview, send with/without credentials

## Potential Next Steps

- Add PKCE support to the OAuth2 demo (code_challenge / code_verifier)
- Add a comparison table page showing all 6 methods side-by-side
- Add Passkeys / WebAuthn demo (requires HTTPS + authenticator)
- Persist state across page refreshes (localStorage for JWT token, etc.)
- Add dark/light theme toggle
- Add a "What went wrong" explainer when requests return 4xx
