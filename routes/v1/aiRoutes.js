import express from "express";
import { handleAIRequest } from "../../controllers/aiController.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/process", verifyToken, handleAIRequest);

export default router;
