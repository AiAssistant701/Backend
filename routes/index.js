import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to AI Automation API!" });
});

router.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "You are authenticated!", user: req.user });
});

export default router;
