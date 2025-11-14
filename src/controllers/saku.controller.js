import * as sakuService from "../services/saku.service.js"
import { fail, success } from "../utils/response.js"

export const getAllSaku = async (req, res) => {
  try {
    const data = await sakuService.findAll()
    return success(res, "Saku list fetched successfully", data)
  } catch (error) {
    const status = error.statusCode || 500
    return fail(res, error.message || "Failed to fetch saku list", status)
  }
}

export const getSakuById = async (req, res) => {
  try {
    const data = await sakuService.findById(req.params.id)
    if (!data) return fail(res, "Saku not found", 404)
    return success(res, "Saku fetched successfully", data)
  } catch (error) {
    const status = error.statusCode || 500
    return fail(res, error.message || "Failed to fetch saku", status)
  }
}

export const createSaku = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return fail(res, "Unauthorized: User ID not found in session", 401)
    }

    if (!req.body) return fail(res, "Missing request body", 422)

    const { saku, wasCreated } = await sakuService.create(userId, req.body)

    if (wasCreated) {
      return success(res, "Saku created successfully", saku, 201)
    } else {
      return success(res, "Saku updated successfully", saku, 200)
    }

  } catch (error) {
    const status = error.statusCode || 400
    return fail(res, error.message || "Failed to create or update saku", status)
  }
}

export const updateSaku = async (req, res) => {
  try {
    const updated = await sakuService.update(req.params.id, req.body)
    if (!updated) return fail(res, "Saku not found", 404)
    return success(res, "Saku updated successfully", updated)
  } catch (error) {
    const status = error.statusCode || 400
    return fail(res, error.message || "Failed to update saku", status)
  }
}

export const deleteSaku = async (req, res) => {
  try {
    const deleted = await sakuService.deleteById(req.params.id)
    if (!deleted) return fail(res, "Saku not found", 404)
    return success(res, "Saku deleted successfully")
  } catch (error) {
    const status = error.statusCode || 400
    return fail(res, error.message || "Failed to delete saku", status)
  }
}
