import { Router } from 'express';
import bcrypt from 'bcryptjs';

const router = Router();

const USERS = {
  alice: { password: bcrypt.hashSync('password123', 10), name: 'Alice', role: 'admin' },
  bob: { password: bcrypt.hashSync('secret', 10), name: 'Bob', role: 'user' },
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.user = { username, name: user.name, role: user.role };
  res.json({
    message: 'Logged in',
    sessionId: req.sessionID,
    user: req.session.user,
  });
});

router.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated — no valid session' });
  }
  res.json({ user: req.session.user, sessionId: req.sessionID });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.json({ message: 'Logged out, session destroyed' });
});

export default router;
