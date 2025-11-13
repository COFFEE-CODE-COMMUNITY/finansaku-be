import { SurveyService } from '../services/survey.service.js'
import { prisma } from '../config/prisma.js'

const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(String(v).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

export async function submitSurvey(req, res, next) {
  try {
    const userId = req.user?.id || req.body.userId // fallback kalau perlu
    const cityName   = (req.body.cityName ?? '').trim()
    const salary     = toNumber(req.body.salary)
    const dependents = toNumber(req.body.dependents)

    if (!userId || !cityName || salary == null || dependents == null) {
      return res.status(400).json({ ok: false, error: 'All fields are required' })
    }

    const service = new SurveyService()
    const data = await service.submitSurvey({ userId, cityName, salary, dependents })

    return res.status(200).json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}

export async function getMySurvey(req, res, next) {
  try {
    const userId = req.user.id
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const saku = await prisma.saku.findFirst({
      where: { userId, year, month },
      include: {
        city: true,
        details: { where: { key: { in: ['dependents'] } }, select: { key: true, valueNumber: true } },
      },
    })

    if (!saku) return res.json({ ok: true, data: null })

    const dependents = saku.details.find(d => d.key === 'dependents')?.valueNumber ?? null

    res.json({
      ok: true,
      data: {
        period: { year: saku.year, month: saku.month },
        city: { id: saku.city.id, name: saku.city.name },
        salary: saku.salary,
        dependents,
      },
    })
  } catch (err) { next(err) }
}

// helper: bentuk response rapi
function shape(saku) {
  if (!saku) return null
  const dependents = saku.details.find(d => d.key === 'dependents')?.valueNumber ?? null
  return {
    period: { year: saku.year, month: saku.month },
    city:   { id: saku.city.id, name: saku.city.name },
    salary: saku.salary,
    dependents,
  }
}

// GET /api/v1/survey/history?year=YYYY&month=MM
export async function getSurveyHistory(req, res, next) {
  try {
    const userId = req.user.id
    const year  = req.query.year ? Number(req.query.year) : null
    const month = req.query.month ? Number(req.query.month) : null

    // validasi sederhana
    if (year && (!Number.isInteger(year) || year < 2000 || year > 2100)) {
      return res.status(400).json({ ok: false, error: 'Invalid year' })
    }
    if (month && (!Number.isInteger(month) || month < 1 || month > 12)) {
      return res.status(400).json({ ok: false, error: 'Invalid month' })
    }

    // case 1: year & month → single period
    if (year && month) {
      const saku = await prisma.saku.findFirst({
        where: { userId, year, month },
        include: {
          city: true,
          details: { where: { key: { in: ['dependents'] } }, select: { key: true, valueNumber: true } },
        },
      })
      return res.json({ ok: true, data: shape(saku) }) // null jika tidak ada
    }

    // case 2: only year → list by month
    if (year && !month) {
      const rows = await prisma.saku.findMany({
        where: { userId, year },
        include: {
          city: true,
          details: { where: { key: { in: ['dependents'] } }, select: { key: true, valueNumber: true } },
        },
        orderBy: { month: 'asc' },
      })
      return res.json({ ok: true, data: rows.map(shape) })
    }

    // case 3: tidak ada query → 400
    return res.status(400).json({ ok: false, error: 'Query params required: year or year+month' })
  } catch (err) {
    next(err)
  }
}