import { PrismaClient } from '../../generated/prisma-v2/index.js';

export const prisma = new PrismaClient();

export async function dbHealth() {
  await prisma.$queryRaw`SELECT 1`;
  return true;
}
