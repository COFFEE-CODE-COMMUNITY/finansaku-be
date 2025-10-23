import * as userService from "../services/user.service.js"
import { ok, fail } from "../utils/response.js"

export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.findAll()
    return ok(res, "Users fetched successfully", users)
  } catch (error) {
    return fail(res, error.message)
  }
}

export const getUserById = async (req, res) => {
  try {
    const user = await userService.findById(req.params.id)
    if (!user) return fail(res, "User not found", 404)
    return ok(res, "User fetched successfully", user)
  } catch (error) {
    return fail(res, error.message)
  }
}

export const createUser = async (req, res) => {
  try {
    const newUser = await userService.create(req.body)
    return ok(res, "User created successfully", newUser)
  } catch (error) {
    return fail(res, error.message)
  }
}

export const updateUser = async (req, res) => {
  try {
    const updated = await userService.update(req.params.id, req.body)
    return ok(res, "User updated successfully", updated)
  } catch (error) {
    return fail(res, error.message)
  }
}

export const deleteUser = async (req, res) => {
  try {
    await userService.deleteById(req.params.id)
    return ok(res, "User deleted successfully")
  } catch (error) {
    return fail(res, error.message)
  }
}
