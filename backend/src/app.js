import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { dbHealth } from './config/prisma.js';
import authRoutes from './routes/auth.routes.js';
import apiRoutes from './routes/api.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', async (_req, res) => {
  try {
    await dbHealth();
    res.json({ status: 'ok', app: 'CampusOne AI', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', app: 'CampusOne AI', database: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 'P2003') return res.status(400).json({ error: 'Invalid related record' });
  if (err.code === 'P2002') return res.status(409).json({ error: 'A record with this identifier already exists' });
  res.status(500).json({ error: 'Something went wrong' });
});

export default app;
