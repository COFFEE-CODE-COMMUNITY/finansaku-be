import { generateRecommendedBudget } from '../services/budget/budget.service.js'
import { prisma } from '../src/config/prisma.js'

// === Controller for handling the recommended budget generation ===
export async function getRecommendedBudget(req, res) {
  const { userId, year, cityId } = req.query
  try {
    // Fetch user's UMK from the database (adjust according to your setup)
    const userUMK = await prisma.saku.findFirst({
      where: { userId, year },
      select: { salary: true },
    })

    if (!userUMK) {
      return res.status(404).json({ error: 'UMK data not found for the user.' })
    }

    // Generate the recommended budget
    const recommendedBudget = await generateRecommendedBudget(userUMK.salary, year, cityId)
    res.json(recommendedBudget)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
