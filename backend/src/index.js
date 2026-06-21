import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import sessionRoutes from './routes/session.js';
import jwtRoutes from './routes/jwt.js';
import oauth2Routes from './routes/oauth2.js';
import oidcRoutes from './routes/oidc.js';
import apikeyRoutes from './routes/apikey.js';
import basicRoutes from './routes/basic.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'demo-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 3600_000 },
}));

app.use('/session', sessionRoutes);
app.use('/jwt', jwtRoutes);
app.use('/oauth2', oauth2Routes);
app.use('/oidc', oidcRoutes);
app.use('/apikey', apikeyRoutes);
app.use('/basic', basicRoutes);

app.listen(3001, () => console.log('Auth backend running on http://localhost:3001'));
