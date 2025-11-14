import { prisma } from '../config/prisma.js'
import { AppError } from '../middlewares/errorHandler.js'

// === Hardcoded "Nasional" city ID from seed.js ===
const NASIONAL_CITY_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Generates a recommended budget for a new user based on survey data.
 * Recommendations are based on local UMK, and surplus is calculated
 * against the user's actual salary.
 * If salary is less than UMK, recommendations are scaled down to fit salary.
 */
export async function getRecommendedBudget(year, cityId, userSalary, dependents) {
  // 1. Get the UMK for the user's city (This is the BASELINE)
  const umkData = await prisma.uMK.findUnique({
    where: { cityId_year: { cityId, year } },
    select: { amount: true },
  })

  if (!umkData) {
    throw new AppError(404, 'UMK data not found for the selected city and year.')
  }
 
  const umkAmount = umkData.amount.toNumber()

  // 2. Get the national living cost percentages
  const livingCost = await prisma.livingCost.findUnique({
    where: {
      year_cityId: {
        year: year,
        cityId: NASIONAL_CITY_ID, // Use the hardcoded Nasional ID
      },
    },
  })

  if (!livingCost) {
    throw new AppError(404, 'National living cost data not found for the specified year.')
  }

  // 3. Define base percentages
  const pct = (value) => (value ? value.toNumber() / 100 : 0)

  let foodPct = pct(livingCost.marketsPct) + pct(livingCost.restaurantsPct)
  let transportPct = pct(livingCost.transportationPct)
  let rentPct = pct(livingCost.rentPct)
  let utilitiesPct = pct(livingCost.utilitiesPct)
  let clothingPct = pct(livingCost.clothingPct)
  let leisurePct = pct(livingCost.sportsLeisurePct)
 
  // Calculate base essential/non-essential split
  let essentialPct = foodPct + transportPct + rentPct + utilitiesPct
  let nonEssentialPct = clothingPct + leisurePct
  let savingsPct = Math.max(0, 1 - essentialPct - nonEssentialPct)

  // 4. Adjust for dependents (as you suggested)
  // Increase food cost by 40% per extra dependent (dependents=1 is baseline)
  const dependentFactor = 1 + (Math.max(0, dependents - 1) * 0.4)
  const originalFoodPct = foodPct
  foodPct = foodPct * dependentFactor
 
  // The extra food cost comes out of savings, then leisure
  const adjustment = foodPct - originalFoodPct
  const originalSavingsPct = savingsPct
 
  savingsPct = Math.max(0, savingsPct - adjustment)
 
  // If savings went to 0, take the rest from non-essentials
  if (savingsPct === 0) {
    const remainingAdjustment = adjustment - originalSavingsPct
    const originalLeisurePct = leisurePct
    leisurePct = Math.max(0, leisurePct - remainingAdjustment)
   
    // If leisure also went to 0, take from clothing
    if (leisurePct === 0) {
      const finalAdjustment = remainingAdjustment - originalLeisurePct
      clothingPct = Math.max(0, clothingPct - finalAdjustment)
    }
  }

  // 5. Calculate "Ideal" monetary values BASED ON UMK
  let recFood = umkAmount * foodPct
  let recTransport = umkAmount * transportPct
  let recRent = umkAmount * rentPct
  let recUtilities = umkAmount * utilitiesPct
  let recClothing = umkAmount * clothingPct
  let recLeisure = umkAmount * leisurePct
  let recSavings = umkAmount * savingsPct

  let totalRecommendedExpenses = recFood + recTransport + recRent + recUtilities + recClothing + recLeisure + recSavings
  let surplus = 0

  // 6. === NEW LOGIC: Check if user salary can cover the UMK-based recommendation ===
  if (userSalary < totalRecommendedExpenses) {
    // SURVIVAL BUDGET: User's salary is the new baseline.
    // We must "compress" the budget, prioritizing essentials.
   
    const deficit = totalRecommendedExpenses - userSalary
    surplus = 0 // No surplus in this case

    // Calculate how much "non-essential" money we have in the ideal budget
    const cuttableAmount = recClothing + recLeisure + recSavings

    if (deficit <= cuttableAmount) {
      // Deficit is smaller than non-essentials. We can cut from them proportionally.
      // === FIX: Guard against division by zero ===
      const scale = (cuttableAmount > 0) ? (cuttableAmount - deficit) / cuttableAmount : 0
      recClothing = recClothing * scale
      recLeisure = recLeisure * scale
      recSavings = recSavings * scale
    } else {
      // Deficit is larger. All non-essentials become 0.
      recClothing = 0
      recLeisure = 0
      recSavings = 0
      
      // We must now cut from essentials.
      const remainingDeficit = deficit - cuttableAmount
      const essentialAmount = recFood + recTransport + recRent + recUtilities
      
      // Scale down all essentials proportionally
      // === FIX: Guard against division by zero and negative scale ===
      const scale = (essentialAmount > 0) ? Math.max(0, (essentialAmount - remainingDeficit)) / essentialAmount : 0
      recFood = recFood * scale
      recTransport = recTransport * scale
      recRent = recRent * scale
      recUtilities = recUtilities * scale
    }
   
    // Recalculate percentages based on the new "survival" amounts
    // === FIX: Guard against division by zero ===
    foodPct = (userSalary > 0) ? recFood / userSalary : 0
    transportPct = (userSalary > 0) ? recTransport / userSalary : 0
    rentPct = (userSalary > 0) ? recRent / userSalary : 0
    utilitiesPct = (userSalary > 0) ? recUtilities / userSalary : 0
    clothingPct = (userSalary > 0) ? recClothing / userSalary : 0
    leisurePct = (userSalary > 0) ? recLeisure / userSalary : 0
    savingsPct = (userSalary > 0) ? recSavings / userSalary : 0

  } else {
    // HAPPY PATH: User salary is >= UMK.
    // Recommendations are based on UMK, and the rest is surplus.
    surplus = userSalary - totalRecommendedExpenses
  }

  // 7. Final Response
  return {
    baseSalaryInput: userSalary,
    umkBaseline: umkAmount,
    dependents,
    recommendations: {
      food: recFood.toFixed(0),
      transport: recTransport.toFixed(0),
      rent: recRent.toFixed(0),
      utilities: recUtilities.toFixed(0),
      clothing: recClothing.toFixed(0),
      leisure: recLeisure.toFixed(0),
      savings: recSavings.toFixed(0),
    },
    surplus: surplus.toFixed(0),
    percentages: {
      food: (foodPct * 100).toFixed(1),
      transport: (transportPct * 100).toFixed(1),
      rent: (rentPct * 100).toFixed(1),
      utilities: (utilitiesPct * 100).toFixed(1),
      clothing: (clothingPct * 100).toFixed(1),
      leisure: (leisurePct * 100).toFixed(1),
      savings: (savingsPct * 100).toFixed(1),
    }
  }
}