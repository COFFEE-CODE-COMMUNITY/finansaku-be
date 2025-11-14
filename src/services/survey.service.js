import { prisma } from '../config/prisma.js'
import { getRecommendedBudget } from './budget.service.js'
import logger from '../config/logger.js'

export class SurveyService {
  async submitSurvey({ userId, cityName, salary, dependents }) {
    // 1) City (find or create)
    let city = await prisma.city.findFirst({
      where: { name: { equals: cityName, mode: 'insensitive' } },
    })
    if (!city) city = await prisma.city.create({ data: { name: cityName } })

    // 2) periode berjalan
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // 3) Saku bulan berjalan (find-or-create, lalu update city/salary)
    let saku = await prisma.saku.findFirst({ where: { userId, year, month } })
    if (!saku) {
      saku = await prisma.saku.create({
        data: { userId, cityId: city.id, year, month, salary },
      })
    } else {
      saku = await prisma.saku.update({
        where: { id: saku.id },
        data: { cityId: city.id, salary },
      })
    }

    // 4) SakuDetail: dependents (Number) — TANPA upsert
    const existing = await prisma.sakuDetail.findFirst({
      where: { sakuId: saku.id, key: 'dependents' },
    })

    if (existing) {
      await prisma.sakuDetail.update({
        where: { id: existing.id },
        data: { valueNumber: dependents },
      })
    } else {
      await prisma.sakuDetail.create({
        data: { sakuId: saku.id, key: 'dependents', valueNumber: dependents },
      })
    }

    // 5) Calculate and Save Recommended Allocations
    logger.info(`[SurveyService] Calculating recommendations for user ${userId}, saku ${saku.id}`)

    // 5a. Delete old allocations for this Saku to prevent duplicates
    await prisma.sakuAllocation.deleteMany({
      where: { sakuId: saku.id }
    })
    logger.info(`[SurveyService] Deleted old allocations for saku ${saku.id}`)

    // 5b. Get new recommendations
    const budget = await getRecommendedBudget(
      year,
      city.id,
      salary,
      dependents
    )

    const allocationPromises = []
    const recommendationData = budget.recommendations // { "Makan": "12345", ... }
    const percentageData = budget.percentages     // { "Makan": "50.5", ... }

    // 5c. Loop and save new allocations
    for (const categoryName in recommendationData) {
      if (Object.hasOwnProperty.call(recommendationData, categoryName)) {
        const amount = Number(recommendationData[categoryName])
        const percentage = Number(percentageData[categoryName])

        // Find or Create the category for this user
        const category = await prisma.budgetCategory.upsert({
          where: {
            userId_name: {
              userId: userId,
              name: categoryName,
            },
          },
          update: { defaultPercentage: percentage }, // Update default % just in case
          create: {
            userId: userId,
            name: categoryName,
            defaultPercentage: percentage,
          },
        })

        // Create the new SakuAllocation record
        const allocationPromise = prisma.sakuAllocation.create({
          data: {
            sakuId: saku.id,
            categoryId: category.id,
            percentage: percentage,
            amount: amount,
          },
        })
        allocationPromises.push(allocationPromise)
      }
    }

    // 5d. Wait for all database writes to finish
    await Promise.all(allocationPromises)
    logger.info(`[SurveyService] Created ${allocationPromises.length} new allocations for saku ${saku.id}`)

    // 6. Fetch the newly created allocations to return them
    const createdAllocations = await prisma.sakuAllocation.findMany({
      where: { sakuId: saku.id },
      include: { category: true }
    })

    // 7. Return the complete Saku object
    return {
      saku: {
        id: saku.id, userId: saku.userId, cityId: saku.cityId,
        year: saku.year, month: saku.month, salary: saku.salary,
      },
      city: { id: city.id, name: city.name },
      details: [{ key: 'dependents', valueNumber: dependents }],
      allocations: createdAllocations, // <-- ADDED allocations
    }
  }
}
