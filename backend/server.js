import { env } from './src/config/env.js';
import app from './src/app.js';
import { prisma } from './src/config/prisma.js';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const server = app.listen(env.PORT, () => {
  console.log(`CampusOne AI backend running on http://localhost:${env.PORT}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
