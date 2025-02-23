import multer from "multer";
import express from "express";
import { handleAIRequest } from "../../controllers/aiController.js";
import verifyToken from "../../middlewares/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/process", verifyToken, upload.single("file"), handleAIRequest);

export default router;
