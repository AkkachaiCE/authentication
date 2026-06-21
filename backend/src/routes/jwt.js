import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET = 'super-secret-jwt-key-for-demo-only';

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
  const payload = { sub: username, name: user.name, role: user.role };
  const token = jwt.sign(payload, SECRET, { expiresIn: '15m', algorithm: 'HS256' });
  res.json({ token });
});

router.get('/profile', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization: Bearer <token> header' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), SECRET);
    res.json({ user: payload });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

export default router;
