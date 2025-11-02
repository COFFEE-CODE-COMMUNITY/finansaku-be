import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'], // optional: ['query'] for debugging
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
