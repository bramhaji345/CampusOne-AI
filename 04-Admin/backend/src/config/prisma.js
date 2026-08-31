import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function dbHealth() {
  await prisma.$queryRaw`SELECT 1`;
  return true;
}
