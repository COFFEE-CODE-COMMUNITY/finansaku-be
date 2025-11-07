import { prisma } from '../config/prisma.js'

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

    return {
      saku: {
        id: saku.id, userId: saku.userId, cityId: saku.cityId,
        year: saku.year, month: saku.month, salary: saku.salary,
      },
      city: { id: city.id, name: city.name },
      details: [{ key: 'dependents', valueNumber: dependents }],
    }
  }
}
