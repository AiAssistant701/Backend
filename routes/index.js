import express from "express";
import v1AuthRoutes from "./v1/authRoutes.js";
import v1UserRoutes from "./v1/userRoutes.js";
import v1ChatRoutes from "./v1/chatRoutes.js";
import v1DashboardRoutes from "./v1/dashboardRoutes.js";
import v1MemoryRoutes from "./v1/memoryRoutes.js";
import v1MhatsappRoutes from "./v1/whatsappRoutes.js";
import v1AiRoutes from "./v1/aiRoutes.js";
import v1AdminRoutes from "./v1/adminRoutes.js";
import v1SubagentsConfig from "./v1/subagentConfigRoutes.js"

const router = express.Router();

router.use("/v1/auth", v1AuthRoutes);
router.use("/v1/users", v1UserRoutes);
router.use("/v1/chat", v1ChatRoutes);
router.use("/v1/dashboard", v1DashboardRoutes);
router.use("/v1/memory", v1MemoryRoutes);
router.use("/v1/whatsapp", v1MhatsappRoutes);
router.use("/v1/ai", v1AiRoutes);
router.use("/v1/admin", v1AdminRoutes);
router.use("/v1/subagents", v1SubagentsConfig);

export default router;
