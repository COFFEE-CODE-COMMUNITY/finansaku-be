import { PrismaClient } from '@prisma/client'
import config from '../config/index.js'

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'], // optional: ['query'] for debugging
  })

if (config.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
