import * as sakuService from "../services/saku.service.js"
import { ok, fail } from "../utils/response.js"

export const getAllSaku = async (req, res) => {
  try {
    const data = await sakuService.findAll()
    return ok(res, "Saku list fetched successfully", data)
  } catch (error) {
    return fail(res, error.message)
  }
}

export const getSakuById = async (req, res) => {
  try {
    const data = await sakuService.findById(req.params.id)
    if (!data) return fail(res, "Saku not found", 404)
    return ok(res, "Saku fetched successfully", data)
  } catch (error) {
    return fail(res, error.message)
  }
}

export const createSaku = async (req, res) => {
  try {
    const newSaku = await sakuService.create(req.body)
    return ok(res, "Saku created successfully", newSaku)
  } catch (error) {
    return fail(res, error.message)
  }
}

export const updateSaku = async (req, res) => {
  try {
    const updated = await sakuService.update(req.params.id, req.body)
    return ok(res, "Saku updated successfully", updated)
  } catch (error) {
    return fail(res, error.message)
  }
}

export const deleteSaku = async (req, res) => {
  try {
    await sakuService.deleteById(req.params.id)
    return ok(res, "Saku deleted successfully")
  } catch (error) {
    return fail(res, error.message)
  }
}
