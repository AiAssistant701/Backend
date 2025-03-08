import express from "express";
import { body } from "express-validator";
import verifyToken from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/rolesMiddleware.js";
import {
  getUserProfile,
  storeApiKeys,
  getApiKeys,
  updateApiKeys,
  deleteApiKeys,
} from "../../controllers/userController.js";

const router = express.Router();

router.get('/profile/:userId', verifyToken, getUserProfile)
router.post("/apikeys", verifyToken, storeApiKeys);
router.get("/apikeys/:userId", verifyToken, getApiKeys);
router.put("/apikeys", verifyToken, updateApiKeys);
router.delete("/apikeys", verifyToken, deleteApiKeys);

export default router;
