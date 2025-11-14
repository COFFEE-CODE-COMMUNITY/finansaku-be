import * as budgetService from '../services/budget.service.js'
import { AppError } from '../middlewares/errorHandler.js'

// === Controller for handling the recommended budget generation ===
export async function getRecommendedBudget(req, res, next) {
  // === NEW: Get all inputs from survey query ===
  const { cityId } = req.query
  const year = parseInt(req.query.year, 10)
  const salary = req.query.salary ? parseFloat(req.query.salary) : null
  const dependents = req.query.dependents ? parseInt(req.query.dependents, 10) : 0

  try {
    // === NEW: Validate all required inputs ===
    if (!year || !cityId || !salary) {
      throw new AppError(400, 'year, cityId, and salary query parameters are required.')
    }

    // Check if the parsed numbers are valid
    if (isNaN(year) || isNaN(salary) || isNaN(dependents)) {
      throw new AppError(400, 'Invalid input. year, salary, and dependents must be numbers.')
    }

    // === NEW: Call service with new survey parameters ===
    const recommendedBudget = await budgetService.getRecommendedBudget(
      year,
      cityId,
      salary,
      dependents
    )

    res.json(recommendedBudget)
  } catch (error) {
    // Pass error to the global error handler
    next(error)
  }
}
