import express from "express"
import * as sakuController from "../controllers/saku.controller.js"

const router = express.Router()

router.get("/", sakuController.getAllSaku)
router.get("/:id", sakuController.getSakuById)
router.post("/", sakuController.createSaku)
router.put("/:id", sakuController.updateSaku)
router.delete("/:id", sakuController.deleteSaku)

export default router
