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
  origin: function (origin, callback) {
    const allowed = [
      env.FRONTEND_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', app: 'CampusOne AI Backend API' });
});

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
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.name === 'MulterError') return res.status(400).json({ error: err.message });
  if (/Upload an Excel/i.test(String(err.message || ''))) return res.status(400).json({ error: err.message });
  if (err.code === 'P2003') return res.status(400).json({ error: 'Invalid related record' });
  if (err.code === 'P2002') return res.status(409).json({ error: 'A record with this identifier already exists' });
  if (
    err.name === 'PrismaClientInitializationError'
    || err.code === 'P1001'
    || /Can't reach database server/i.test(String(err.message || ''))
  ) {
    return res.status(503).json({
      error: 'Database is not running. In the backend folder run npm run db:local, then try login again.',
    });
  }
  res.status(500).json({ error: err.message || 'Something went wrong', code: err.code });
});

export default app;
