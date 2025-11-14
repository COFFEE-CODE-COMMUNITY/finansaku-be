import request from 'supertest'
import app from '../src/app.js'

describe('GET /api/v1/budget/recommended', () => {
  it('should return recommended budget for the user', async () => {
    const response = await request(app)
      .get('/api/v1/budget/recommended')
      .query({ userId: 'demo-user-id', year: 2025, cityId: 'jakartaCityId' })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('foodBudget')
    expect(response.body).toHaveProperty('transportBudget')
    expect(response.body).toHaveProperty('rentBudget')
    expect(response.body).toHaveProperty('clothingBudget')
    expect(response.body).toHaveProperty('utilitiesBudget')
    expect(response.body).toHaveProperty('sportsLeisureBudget')
    expect(response.body).toHaveProperty('apartmentBudget')
  })

  it('should return an error if no data is found', async () => {
    const response = await request(app)
      .get('/api/v1/budget/recommended')
      .query({ userId: 'non-existing-user-id', year: 2025 })

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('UMK data not found for the user.')
  })
})
