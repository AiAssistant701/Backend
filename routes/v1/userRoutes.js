import express from "express";
import { body } from "express-validator";
import verifyToken from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/rolesMiddleware.js";
import {
  storeApiKeys,
  getApiKeys,
  updateApiKeys,
  deleteApiKeys,
} from "../../controllers/userController.js";

const router = express.Router();

router.post("/", (req, res) => {
  res.send("Ready!!!");
});

router.post("/apikeys", storeApiKeys);
router.get("/apikeys/:userId", getApiKeys);
router.put("/apikeys", updateApiKeys);
router.delete("/apikeys", deleteApiKeys);

export default router;
