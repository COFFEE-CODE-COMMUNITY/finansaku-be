import request from 'supertest'
import app from '../src/app.js'
import { prisma } from '../src/config/prisma.js'

beforeAll(async () => {
  console.log('🔗 Initializing Prisma connection...')
  await prisma.$connect()
  await new Promise(res => setTimeout(res, 200))
})

afterAll(async () => {
  console.log('🧹 Closing Prisma connection...')
  await prisma.$disconnect()
})

describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
  }

  beforeAll(() => console.log('🚀 Starting Auth API tests...'))

  beforeEach(async () => {
    await prisma.sakuAllocation.deleteMany()
    await prisma.sakuDetail.deleteMany() // <-- ADDED THIS LINE
    await prisma.saku.deleteMany()
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(() => console.log('✅ Finished Auth API tests.'))

  it('should register a user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Content-Type', 'application/json')
      .send(testUser)

    console.log('REGISTER RESPONSE:', res.status, res.body)

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('message', 'Account created successfully. Verification email sent.')
    expect(res.body.data).toBeDefined()
  })

  it('should login the registered user and return cookies', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .set('Content-Type', 'application/json')
      .send(testUser)

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: testUser.email, password: testUser.password })

    expect(res.status).toBe(200)
    expect(res.headers['set-cookie']).toBeDefined()
    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('message', 'Login successful')
  })

  it('should reject login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: testUser.email, password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('success', false)
  })
})