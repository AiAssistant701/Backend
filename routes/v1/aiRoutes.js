import express from "express";
import upload from "../../utils/multerConfig.js";
import verifyToken from "../../middlewares/authMiddleware.js";
import { handleAIRequest } from "../../controllers/aiController.js";

const router = express.Router();

router.post("/process", verifyToken, upload.single("file"), handleAIRequest);

export default router;
