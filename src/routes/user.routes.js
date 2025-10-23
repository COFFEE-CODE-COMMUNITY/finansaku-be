import express from "express"
import * as userController from "../controllers/user.controller.js"

const router = express.Router()

router.get("/", userController.getAllUsers)
router.get("/:id", userController.getUserById)
router.post("/", userController.createUser)
router.patch("/:id", userController.updateUser)
router.delete("/:id", userController.deleteUser)

export default router
