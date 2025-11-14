import { prisma } from '../../config/prisma.js'

// === Function to generate recommended budget based on UMK and LivingCost ===
export async function generateRecommendedBudget(umk, year, cityId = null) {
  // Fetch living cost data for the user (either national or city-specific)
  const livingCost = await prisma.livingCost.findFirst({
    where: { year, cityId },
  })

  if (!livingCost) {
    throw new Error('Living cost data not found for the specified year and city.')
  }

  // Calculate the budget for each category based on UMK and LivingCost percentages
  const foodBudget = umk * (livingCost.restaurantsPct + livingCost.marketsPct) / 100
  const transportBudget = umk * livingCost.transportationPct / 100
  const rentBudget = umk * livingCost.rentPct / 100
  const clothingBudget = umk * livingCost.clothingPct / 100
  const utilitiesBudget = umk * livingCost.utilitiesPct / 100
  const sportsLeisureBudget = umk * livingCost.sportsLeisurePct / 100
  const apartmentBudget = umk * livingCost.buyApartmentPct / 100

  // Return the calculated budget object
  return {
    foodBudget,
    transportBudget,
    rentBudget,
    clothingBudget,
    utilitiesBudget,
    sportsLeisureBudget,
    apartmentBudget,
  }
}
