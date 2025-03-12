import express from "express";
import passport from "passport";
import User from "../../models/User.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  generateToken,
} from "../../controllers/authController.js";
import { body } from "express-validator";
import verifyToken from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/rolesMiddleware.js";

const router = express.Router();

router.post(
  "/signup",
  [
    body("firstName").notEmpty().withMessage("First Name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  registerUser
);

router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/verify-email/:token", verifyEmail);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);

// =========GOOGLE SIGN-IN AUTH=============
router.get("/google", passport.authenticate("google"));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res, next) => {
    if (!req.user)
      return next({ statusCode: 401, message: "Authentication failed" });

    const token = generateToken(req.user.id);

    const frontendURL = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
    return res.redirect(frontendURL);
  }
);

// =========TEST========= Only Admins Can View All Users
router.get(
  "/admin/users",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    const users = await User.find();
    res.status(200).json(users);
  }
);

export default router;
