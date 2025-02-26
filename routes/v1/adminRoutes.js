import express from "express";
import { logController } from "../../controllers/adminController.js";

const router = express.Router();

router.get("/ai-decisions", logController);

export default router;
