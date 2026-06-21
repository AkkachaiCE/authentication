# Auth Learning App

An interactive web app for learning 6 authentication methods through animated flow diagrams and live HTTP demos.

## Auth Methods Covered

- Session / Cookie
- JWT (JSON Web Tokens)
- OAuth 2.0 Authorization Code Flow
- OpenID Connect (OIDC)
- API Keys
- HTTP Basic Auth

## Stack

- **Frontend**: Vite + React 18, React Router v6, Tailwind CSS, Framer Motion
- **Backend**: Node.js 22, Express 4, express-session, jsonwebtoken, bcryptjs

## Run with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Run Locally

```bash
# Terminal 1 — backend
cd backend && npm install && node src/index.js

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

## Demo Credentials

| Username | Password     |
|----------|-------------|
| alice    | password123 |
| bob      | secret      |

> All state is in-memory — sessions, API keys, and OAuth tokens reset on restart.
