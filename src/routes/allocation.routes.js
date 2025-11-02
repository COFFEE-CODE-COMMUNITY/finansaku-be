import express from "express"
import * as allocationController from "../controllers/allocation.controller.js"

const router = express.Router()

router.get("/", allocationController.getAllAllocations)
router.get("/:id", allocationController.getAllocationById)
router.post("/", allocationController.createAllocation)
router.patch("/:id", allocationController.updateAllocation)
router.delete("/:id", allocationController.deleteAllocation)
router.post("/distribute", allocationController.distributeAllocation)

export default router
