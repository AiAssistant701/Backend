import express from "express";
import { body } from "express-validator";
import verifyToken from "../middlewares/authMiddleware.js";
import { checkRole } from "../middlewares/rolesMiddleware.js";
import { verifyWebhook, receiveWhatsAppMessage } from "../integrations/whatsappService.js";

const router = express.Router();

router.get("/webhook", verifyWebhook);
router.post("/webhook", receiveWhatsAppMessage);

export default router;
