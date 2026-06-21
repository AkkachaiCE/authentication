import { Router } from 'express';

const router = Router();

const USERS = {
  alice: { password: 'password123', name: 'Alice', role: 'admin' },
  bob: { password: 'secret', name: 'Bob', role: 'user' },
};

router.get('/resource', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Demo"');
    return res.status(401).json({ error: 'Missing Authorization: Basic <base64> header' });
  }
  const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
  const [username, password] = decoded.split(':');
  const user = USERS[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials', decoded });
  }
  res.json({
    message: 'Access granted',
    decoded,
    user: { username, name: user.name, role: user.role },
  });
});

export default router;
