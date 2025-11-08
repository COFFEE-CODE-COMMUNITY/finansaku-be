import express from "express"
import {
  submitSurvey,
  getMySurvey,
  getSurveyHistory,
} from "../controllers/survey.controller.js"
import { authenticate } from "../middlewares/auth.middleware.js"

const router = express.Router()

// --- helpers lokal (tanpa ubah file lain) ---
const parseCookie = (req, name) => {
  if (req.cookies) return req.cookies[name]
  const raw = req.headers.cookie
  if (!raw) return undefined
  for (const part of raw.split(";")) {
    const [k, ...v] = part.split("=")
    if (k.trim() === name) return decodeURIComponent(v.join("="))
  }
}

const useTokenFromCookie = (req, res, next) => {
  // Kalau auth middleware tim A cuma baca Bearer,
  // kita ambil token dari cookie lalu “sulap” jadi Authorization.
  if (!req.headers.authorization) {
    const token = parseCookie(req, "access_token")
    if (token) req.headers.authorization = `Bearer ${token}`
  }
  next()
}

/**
 * === NORMALISASI BODY ===
 * FE kirim: { cityName, salary, dependents }
 * - cityName: string
 * - salary:   number | string angka -> number
 * - dependents: int >= 0  (tidak termasuk diri sendiri)
 *
 * Kita siapkan juga field internal:
 * - city           = cityName
 * - householdSize  = dependents + 1
 */
const normalizeSurveyBody = (req, res, next) => {
  const b = req.body || {}
  const out = { ...b }

  // cityName / city
  const cityName =
    (typeof b.cityName === "string" && b.cityName.trim()) ||
    (typeof b.city === "string" && b.city.trim()) ||
    undefined
  if (cityName) {
    out.cityName = cityName
    out.city = cityName // untuk controller/service yang pakai 'city'
  }

  // salary -> number
  if (b.salary != null) out.salary = Number(b.salary)

  // dependents -> int >= 0
  let deps
  if (b.dependents != null) deps = Number(b.dependents)
  else if (b.tanggunganUser != null) deps = Number(b.tanggunganUser)
  else if (b.householdSize != null) deps = Number(b.householdSize) - 1

  if (Number.isFinite(deps)) out.dependents = Math.max(0, Math.floor(deps))

  // internal: householdSize = dependents + 1
  if (Number.isInteger(out.dependents)) {
    out.householdSize = out.dependents + 1
  }

  req.body = out
  next()
}

const validateSurveyPayload = (req, res, next) => {
  const { cityName, salary, dependents } = req.body || {}
  const okCity = typeof cityName === "string" && cityName.length > 0
  const okSalary = Number.isFinite(salary) && salary > 0
  const okDeps = Number.isInteger(dependents) && dependents >= 0

  if (!(okCity && okSalary && okDeps)) {
    return res.status(400).json({
      ok: false,
      code: "BAD_PAYLOAD",
      error:
        "Payload harus berisi { cityName, salary:number, dependents:int>=0 }",
    })
  }
  next()
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// --- routes ---
router.post(
  "/submit",
  useTokenFromCookie,   // ambil token dari cookie kalau header kosong
  authenticate,         // tetap pakai middleware tim A
  normalizeSurveyBody,  // mapping: cityName/salary/dependents -> bentuk internal
  validateSurveyPayload,
  asyncHandler(submitSurvey),
)

router.get("/me",
  useTokenFromCookie,
  authenticate,
  asyncHandler(getMySurvey),
)

router.get("/history",
  useTokenFromCookie,
  authenticate,
  asyncHandler(getSurveyHistory),
)

export default router
