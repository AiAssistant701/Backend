import express from "express";
import { body } from "express-validator";
import verifyToken from "../middlewares/authMiddleware.js";
import { checkRole } from "../middlewares/rolesMiddleware.js";

const router = express.Router();

router.post("/", (req, res) => {
    res.send("Ready!!!")
});

export default router;
