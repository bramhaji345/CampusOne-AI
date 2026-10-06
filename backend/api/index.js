let app;
let initError = null;

try {
  const mod = await import('../src/app.js');
  app = mod.default;
} catch (err) {
  initError = err;
  console.error('Production backend initialization failed:', {
    name: err?.name,
    message: err?.message,
  });
}

export default function handler(req, res) {
  if (initError) {
    console.error('Backend handler invoked with initialization error:', {
      name: initError?.name,
      message: initError?.message,
    });

    return res.status(503).json({
      error: 'Service temporarily unavailable. Please try again shortly.',
      ...(process.env.NODE_ENV === 'development'
        ? { devMessage: initError.message }
        : {}),
    });
  }

  return app(req, res);
}
