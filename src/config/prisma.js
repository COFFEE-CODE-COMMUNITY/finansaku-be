import { PrismaClient } from '@prisma/client'
import logger from './logger.js'

// === Global Prisma Singleton ===
const globalForPrisma = globalThis
if (!globalForPrisma.__PRISMA__) {
  globalForPrisma.__PRISMA__ = new PrismaClient({
    log: ['info', 'warn', 'error'],
  })
}

const prisma = globalForPrisma.__PRISMA__

// === Lazy connect (only once) ===
if (!prisma._isConnected) {
  prisma.$connect()
    .then(() => {
      prisma._isConnected = true
      logger.info('🟢 [Prisma] Connected successfully')
    })
    .catch(err => {
      logger.error({ err }, '❌ [Prisma] Failed to connect')
    })
}

// === Graceful disconnect only when process exits ===
process.once('beforeExit', async () => {
  if (prisma._isConnected) {
    await prisma.$disconnect().catch(() => {})
    prisma._isConnected = false
    logger.info('🔴 [Prisma] Disconnected cleanly on exit')
  }
})

export { prisma }
export default prisma
