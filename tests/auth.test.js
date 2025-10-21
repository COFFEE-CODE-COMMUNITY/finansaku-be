import request from 'supertest'
import app from '../src/app.js'

// === Auth API Integration Tests ===
describe('Auth API', () => {
  beforeAll(() => {
    console.log('🚀 Starting Auth API tests...')
  })

  afterAll(() => {
    console.log('🧹 Finished Auth API tests.')
  })

  it('should register a user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        cityId: 'uuid-from-seed',      // replace with actual seeded UUID
        templateId: 'uuid-from-seed',  // replace with actual seeded UUID
      })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('message', 'User registered successfully')
    expect(res.body.data).toHaveProperty('user')
  })
})
