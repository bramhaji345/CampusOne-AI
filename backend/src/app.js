import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { dbHealth } from './config/prisma.js';
import { uploadDir } from './services/storage.service.js';
import authRoutes from './routes/auth.routes.js';
import apiRoutes from './routes/api.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Trust proxy for rate limiting behind reverse proxies (Vercel, Nginx, Render)
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // SPA renders separate client assets
  })
);

// Strict CORS Allowlist
const normalizedOrigins = [
  env.FRONTEND_URL?.replace(/\/$/, ''),
  env.ADDITIONAL_FRONTEND_URL?.replace(/\/$/, ''),
  ...env.ALLOWED_ORIGINS,
].filter(Boolean);

const isDevelopment = process.env.NODE_ENV === 'development';
if (isDevelopment) {
  normalizedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000');
}

const previewPattern = process.env.VERCEL_PROJECT_NAME
  ? new RegExp(`^https:\\/\\/${process.env.VERCEL_PROJECT_NAME}(-[a-z0-9_-]+)?\\.vercel\\.app$`)
  : null;

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server or same-origin requests with no origin header
      if (!origin) return callback(null, true);

      const trimmed = origin.replace(/\/$/, '');
      if (normalizedOrigins.includes(trimmed)) {
        return callback(null, true);
      }

      // Allow verified deployment previews belonging strictly to this project
      if (previewPattern && previewPattern.test(trimmed)) {
        return callback(null, true);
      }

      callback(new Error('Cross-Origin Request Blocked: Origin not in authorized allowlist'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// Request Correlation ID Middleware
app.use((req, res, next) => {
  const reqId = req.headers['x-request-id'] || randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
});

// JSON Body Parser
app.use(express.json({ limit: '10mb' }));

// Static Assets
app.use('/uploads', express.static(uploadDir, { maxAge: '7d' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { maxAge: '7d' }));

// Rate Limiting
const isTest = process.env.NODE_ENV === 'test';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { error: 'Too many reset requests. Please try again after 15 minutes.' },
});

// Health Checks & Base Route
app.get('/', (_req, res) => {
  res.json({ status: 'ok', app: 'CampusOne AI Backend API' });
});

app.get('/api/health', async (_req, res) => {
  try {
    await dbHealth();
    res.json({ status: 'ok', app: 'CampusOne AI', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', app: 'CampusOne AI', database: 'disconnected' });
  }
});

// Apply rate limiters to routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api', generalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Centralized Error Handler
app.use((err, req, res, _next) => {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.error(`[Error ${req.id || 'N/A'}]`, err);
  } else {
    console.error(`[Error ${req.id || 'N/A'}]`, {
      name: err.name,
      message: err.message,
      code: err.code,
      status: err.status,
    });
  }

  if (err.status) return res.status(err.status).json({ error: err.message, requestId: req.id });
  if (err.name === 'MulterError') return res.status(400).json({ error: err.message, requestId: req.id });
  if (/Upload an Excel/i.test(String(err.message || ''))) return res.status(400).json({ error: err.message, requestId: req.id });
  if (err.code === 'P2003') return res.status(400).json({ error: 'Invalid related record', requestId: req.id });
  if (err.code === 'P2002') return res.status(409).json({ error: 'A record with this identifier already exists', requestId: req.id });

  if (
    err.name === 'PrismaClientInitializationError' ||
    err.code === 'P1001' ||
    /Can't reach database server/i.test(String(err.message || ''))
  ) {
    return res.status(503).json({
      error: isDev
        ? 'Database is not running. In the backend folder run npm run db:local, then try login again.'
        : 'Database service temporarily unavailable. Please try again shortly.',
      requestId: req.id,
    });
  }

  // Never leak internal stack or unhandled error internals in production
  const response = {
    error: isDev ? (err.message || 'Something went wrong') : 'Internal server error',
    requestId: req.id,
  };
  if (isDev && err.code) response.code = err.code;

  res.status(500).json(response);
});

export default app;
