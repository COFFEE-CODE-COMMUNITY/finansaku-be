import * as sakuService from "../services/saku.service.js"
import { ok, fail } from "../utils/response.js"

export const getAllSaku = async (req, res) => {
  try {
    const data = await sakuService.findAll()
    return ok(res, "Saku list fetched successfully", data)
  } catch (error) {
    const status = error.statusCode || 500
    return fail(res, error.message || "Failed to fetch saku list", status)
  }
}

export const getSakuById = async (req, res) => {
  try {
    const data = await sakuService.findById(req.params.id)
    if (!data) return fail(res, "Saku not found", 404)
    return ok(res, "Saku fetched successfully", data)
  } catch (error) {
    const status = error.statusCode || 500
    return fail(res, error.message || "Failed to fetch saku", status)
  }
}

export const createSaku = async (req, res) => {
  try {
    if (!req.body) return fail(res, "Missing request body", 422)
    const newSaku = await sakuService.create(req.body)
    return ok(res, "Saku created successfully", newSaku, 201)
  } catch (error) {
    const status = error.statusCode || 400
    return fail(res, error.message || "Failed to create saku", status)
  }
}

export const updateSaku = async (req, res) => {
  try {
    const updated = await sakuService.update(req.params.id, req.body)
    if (!updated) return fail(res, "Saku not found", 404)
    return ok(res, "Saku updated successfully", updated)
  } catch (error) {
    const status = error.statusCode || 400
    return fail(res, error.message || "Failed to update saku", status)
  }
}

export const deleteSaku = async (req, res) => {
  try {
    const deleted = await sakuService.deleteById(req.params.id)
    if (!deleted) return fail(res, "Saku not found", 404)
    return ok(res, "Saku deleted successfully")
  } catch (error) {
    const status = error.statusCode || 400
    return fail(res, error.message || "Failed to delete saku", status)
  }
}
