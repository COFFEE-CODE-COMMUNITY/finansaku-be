import * as umkService from "../services/umk.service.js"
import { success, fail } from "../utils/response.js"

export const getAllUMK = async (req, res) => {
  try {
    const data = await umkService.findAll()
    return success(res, "UMK list fetched successfully", data)
  } catch (error) {
    const status = error.statusCode || 500
    return fail(res, error.message || "Failed to fetch UMK list", status)
  }
}

export const getUMKById = async (req, res) => {
  try {
    const data = await umkService.findById(req.params.id)
    if (!data) return fail(res, "UMK not found", 404)
    return success(res, "UMK fetched successfully", data)
  } catch (error) {
    const status = error.statusCode || 500
    return fail(res, error.message || "Failed to fetch UMK", status)
  }
}

export const updateUMK = async (req, res) => {
  try {
    const updated = await umkService.update(req.params.id, req.body)
    if (!updated) return fail(res, "UMK not found", 404)
    return success(res, "UMK updated successfully", updated)
  } catch (error) {
    const status = error.statusCode || 400
    return fail(res, error.message || "Failed to update UMK", status)
  }
}
