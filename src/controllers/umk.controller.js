import * as umkService from "../services/umk.service.js"
import { ok, fail } from "../utils/response.js"

export const getAllUMK = async (req, res) => {
  try {
    const data = await umkService.findAll()
    return ok(res, "UMK list fetched successfully", data)
  } catch (error) {
    return fail(res, error.message)
  }
}

export const getUMKById = async (req, res) => {
  try {
    const data = await umkService.findById(req.params.id)
    if (!data) return fail(res, "UMK not found", 404)
    return ok(res, "UMK fetched successfully", data)
  } catch (error) {
    return fail(res, error.message)
  }
}

export const updateUMK = async (req, res) => {
  try {
    const updated = await umkService.update(req.params.id, req.body)
    return ok(res, "UMK updated successfully", updated)
  } catch (error) {
    return fail(res, error.message)
  }
}
