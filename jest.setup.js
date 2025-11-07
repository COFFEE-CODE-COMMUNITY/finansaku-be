// === Environment setup ===
process.env.NODE_ENV = 'test'
process.env.ENABLE_REDIS = 'false'
process.env.AGGREGATOR_ENABLE_CRON = 'false'

// Lazy import to avoid top-level warnings
let prisma, logger

beforeAll(async () => {
  const { prisma: prismaClient } = await import('./src/config/prisma.js')
  const { default: appLogger } = await import('./src/config/logger.js')

  prisma = prismaClient
  logger = appLogger

  try {
    logger.info('🧩 [Test Setup] Connecting Prisma client...')
    await prisma.$connect()
    logger.info('✅ [Test Setup] Prisma connected successfully')
  } catch (err) {
    console.error('❌ [Test Setup] Failed to connect Prisma:', err)
    process.exit(1)
  }
})

// ❌ Remove disconnect from afterAll — Jest handles it automatically
afterAll(() => {
  console.log('🧹 [Test Teardown] Leaving Prisma connection open for Jest')
})
