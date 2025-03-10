import express from "express";
import { body } from "express-validator";
import verifyToken from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/rolesMiddleware.js";
import {
  fetchUserProfile,
  storeApiKeys,
  getApiKeys,
  updateApiKeys,
  deleteApiKeys,
  fetchUserTaskHistory
} from "../../controllers/userController.js";

const router = express.Router();

router.get("/profile/:userId", verifyToken, fetchUserProfile);
router.post("/apikeys", verifyToken, storeApiKeys);
router.get("/apikeys/:userId", verifyToken, getApiKeys);
router.put("/apikeys", verifyToken, updateApiKeys);
router.delete("/apikeys", verifyToken, deleteApiKeys);
router.get("/task/history/:userId", verifyToken, fetchUserTaskHistory);

export default router;
