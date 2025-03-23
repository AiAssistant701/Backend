import express from "express";
import { body } from "express-validator";
import verifyToken from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/rolesMiddleware.js";
import {
  fetchSubagentConfig,
  updateSubagentConfiguration,
} from "../../controllers/subagentConfigController.js";

const router = express.Router();

router.get("/:subagentType/config", verifyToken, fetchSubagentConfig);
router.put("/:subagentType/config", verifyToken, updateSubagentConfiguration);

export default router;
