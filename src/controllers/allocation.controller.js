import * as allocationService from "../services/allocation.service.js"
import { ok, fail } from "../utils/response.js"

export const getAllAllocations = async (req, res) => {
  try {
    const result = await allocationService.findAll()
    return ok(res, "List of allocations", result)
  } catch (err) {
    return fail(res, err.message)
  }
}

export const getAllocationById = async (req, res) => {
  try {
    const result = await allocationService.findById(req.params.id)
    return ok(res, "Allocation found", result)
  } catch (err) {
    return fail(res, err.message)
  }
}

export const createAllocation = async (req, res) => {
  try {
    const result = await allocationService.create(req.body)
    return ok(res, "Allocation created", result)
  } catch (err) {
    return fail(res, err.message)
  }
}

export const updateAllocation = async (req, res) => {
  try {
    const result = await allocationService.update(req.params.id, req.body)
    return ok(res, "Allocation updated", result)
  } catch (err) {
    return fail(res, err.message)
  }
}

export const deleteAllocation = async (req, res) => {
  try {
    const result = await allocationService.deleteById(req.params.id)
    return ok(res, "Allocation deleted", result)
  } catch (err) {
    return fail(res, err.message)
  }
}

export const distributeAllocation = async (req, res) => {
  try {
    const { sakuId, allocations } = req.body
    const result = await allocationService.distributeBudget(sakuId, allocations)
    return ok(res, "Budget distributed successfully", result)
  } catch (err) {
    return fail(res, err.message)
  }
}
