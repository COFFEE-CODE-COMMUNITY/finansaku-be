import * as allocationService from "../services/allocation.service.js"
import { ok, fail } from "../utils/response.js"

export const getAllAllocations = async (req, res) => {
  try {
    const result = await allocationService.findAll()
    return ok(res, "List of allocations", result)
  } catch (err) {
    const status = err.statusCode || 500
    return fail(res, err.message || "Failed to fetch allocations", status)
  }
}

export const getAllocationById = async (req, res) => {
  try {
    const result = await allocationService.findById(req.params.id)
    if (!result) return fail(res, "Allocation not found", 404)
    return ok(res, "Allocation found", result)
  } catch (err) {
    const status = err.statusCode || 500
    return fail(res, err.message || "Failed to fetch allocation", status)
  }
}

export const createAllocation = async (req, res) => {
  try {
    const result = await allocationService.create(req.body)
    return ok(res, "Allocation created", result, 201)
  } catch (err) {
    const status = err.statusCode || 400
    return fail(res, err.message || "Failed to create allocation", status)
  }
}

export const updateAllocation = async (req, res) => {
  try {
    const result = await allocationService.update(req.params.id, req.body)
    if (!result) return fail(res, "Allocation not found", 404)
    return ok(res, "Allocation updated", result)
  } catch (err) {
    const status = err.statusCode || 400
    return fail(res, err.message || "Failed to update allocation", status)
  }
}

export const deleteAllocation = async (req, res) => {
  try {
    const result = await allocationService.deleteById(req.params.id)
    if (!result) return fail(res, "Allocation not found", 404)
    return ok(res, "Allocation deleted", result)
  } catch (err) {
    const status = err.statusCode || 400
    return fail(res, err.message || "Failed to delete allocation", status)
  }
}

export const distributeAllocation = async (req, res) => {
  try {
    const { sakuId, allocations } = req.body
    if (!sakuId || !allocations) return fail(res, "Missing required fields", 422)
    const result = await allocationService.distributeBudget(sakuId, allocations)
    return ok(res, "Budget distributed successfully", result)
  } catch (err) {
    const status = err.statusCode || 400
    return fail(res, err.message || "Failed to distribute budget", status)
  }
}
