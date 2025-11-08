import express from 'express'
import { submitSurvey, getMySurvey, getSurveyHistory } from '../controllers/survey.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = express.Router()

// --- helpers lokal (tanpa ubah file lain) ---
const parseCookie = (req, name) => {
  if (req.cookies) return req.cookies[name]
  const raw = req.headers.cookie
  if (!raw) return undefined
  for (const part of raw.split(';')) {
    const [k, ...v] = part.split('=')
    if (k.trim() === name) return decodeURIComponent(v.join('='))
  }
}

const useTokenFromCookie = (req, res, next) => {
  // Kalau auth middleware tim A cuma baca Bearer,
  // kita ambil token dari cookie lalu “sulap” jadi Authorization.
  if (!req.headers.authorization) {
    const token = parseCookie(req, 'access_token')
    if (token) req.headers.authorization = `Bearer ${token}`
  }
  next()
}

const normalizeSurveyBody = (req, res, next) => {
  const b = req.body || {}
  const out = { ...b }

  // map FE: tanggunganUser -> householdSize (+1 untuk diri sendiri)
  if (b.tanggunganUser != null && out.householdSize == null) {
    const n = Number(b.tanggunganUser)
    out.householdSize = Number.isFinite(n) ? n + 1 : undefined
  }

  if (out.salary != null) out.salary = Number(out.salary)
  if (typeof out.city === 'string') out.city = out.city.trim()

  req.body = out
  next()
}

const validateSurveyPayload = (req, res, next) => {
  const { city, salary, householdSize } = req.body || {}
  if (!city || !Number.isFinite(salary) || !Number.isFinite(householdSize) || householdSize < 1) {
    return res.status(400).json({
      ok: false,
      code: 'BAD_PAYLOAD',
      error: 'Payload harus berisi { city, salary:number, householdSize:int>=1 }',
    })
  }
  next()
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// --- routes ---
router.post(
  '/submit',
  useTokenFromCookie,         // ambil token dari cookie kalau header kosong
  authenticate,               // tetap pakai middleware tim A
  normalizeSurveyBody,        // rapikan/mapping body
  validateSurveyPayload,      // tolak 400 (jangan 500)
  asyncHandler(submitSurvey), // aman dari unhandled promise
)

router.get('/me',
  useTokenFromCookie,
  authenticate,
  asyncHandler(getMySurvey),
)

router.get('/history',
  useTokenFromCookie,
  authenticate,
  asyncHandler(getSurveyHistory),
)

export default router
