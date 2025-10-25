import request from 'supertest'
import app from '../src/app.js'

// === Auth API Integration Tests ===
describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    username: 'testuser_' + Date.now(),
    email: `test_${Date.now()}@example.com`,
    password: 'password123'
  }

  beforeAll(() => {
    console.log('🚀 Starting Auth API tests...')
  })

  afterAll(() => {
    console.log('🧹 Finished Auth API tests.')
  })

  it('should register a user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('message', 'User registered successfully')
    expect(res.body.data).toBeDefined()
  })

  it('should login the registered user and return cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })

    expect(res.status).toBe(200)
    expect(res.headers['set-cookie']).toBeDefined()
    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('message', 'Login successful')
    expect(res.body.data).toHaveProperty('user')
  })

  it('should reject login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('success', false)
  })
})
