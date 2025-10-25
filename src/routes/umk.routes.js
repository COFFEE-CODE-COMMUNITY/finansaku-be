import express from "express"
import * as umkController from "../controllers/umk.controller.js"

const router = express.Router()

// Read all UMK (public)
router.get("/", umkController.getAllUMK)

// Read one UMK by ID (optional)
router.get("/:id", umkController.getUMKById)

// Update UMK (admin only)
router.patch("/:id", umkController.updateUMK)

export default router
