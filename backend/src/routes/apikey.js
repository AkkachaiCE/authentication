import { Router } from 'express';
import { randomBytes } from 'crypto';

const router = Router();
const keys = new Map(); // key → { name, createdAt, lastUsed, active }

router.post('/generate', (req, res) => {
  const { name = 'My App' } = req.body;
  const key = 'ak_' + randomBytes(20).toString('hex');
  keys.set(key, { name, createdAt: new Date().toISOString(), lastUsed: null, active: true });
  res.json({ key, name, message: 'Store this key securely — it will not be shown again' });
});

router.get('/data', (req, res) => {
  const key = req.headers['x-api-key'];
  if (!key) return res.status(401).json({ error: 'Missing X-API-Key header' });
  const entry = keys.get(key);
  if (!entry) return res.status(401).json({ error: 'Invalid API key' });
  if (!entry.active) return res.status(403).json({ error: 'API key has been revoked' });
  entry.lastUsed = new Date().toISOString();
  res.json({ message: 'Authenticated via API key', keyName: entry.name, data: { items: ['widget-A', 'widget-B', 'widget-C'] } });
});

router.post('/revoke', (req, res) => {
  const { key } = req.body;
  const entry = keys.get(key);
  if (!entry) return res.status(404).json({ error: 'Key not found' });
  entry.active = false;
  res.json({ message: 'Key revoked', key });
});

router.get('/list', (req, res) => {
  const list = [...keys.entries()].map(([k, v]) => ({ key: k.slice(0, 10) + '...', ...v }));
  res.json({ keys: list });
});

export default router;
