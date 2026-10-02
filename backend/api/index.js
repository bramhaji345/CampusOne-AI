let app;
let initError = null;

try {
  const mod = await import('../src/app.js');
  app = mod.default;
  const { ensureExGrades } = await import('../src/config/prisma.js');
  ensureExGrades().catch(() => {});
} catch (err) {
  initError = err;
  console.error('Failed to load CampusOne Express app:', err);
}

export default function handler(req, res) {
  if (initError) {
    return res.status(500).json({
      error: 'CampusOne Backend Initialization Failed',
      message: initError.message,
      stack: initError.stack,
      envCheck: {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        hasJwtSecret: Boolean(process.env.JWT_SECRET),
        databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) : null
      }
    });
  }
  return app(req, res);
}

