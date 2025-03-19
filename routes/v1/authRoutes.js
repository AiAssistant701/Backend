import express from "express";
import passport from "passport";
import User from "../../models/User.js";
import { body } from "express-validator";
import {
  registerUser,
  loginUser,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  generateToken,
} from "../../controllers/authController.js";
import { passwordRegex } from "../../utils/constants.js";
import { getUserByGoogleID } from "../../usecases/users.js";
import verifyToken from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/rolesMiddleware.js";
import responseHandler from "../../middlewares/responseHandler.js";
import { sanitizeInput } from "../../middlewares/sanitizeInput.js";

const router = express.Router();

router.post(
  "/signup",
  [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("First Name is required")
      .isAlpha()
      .withMessage("First Name should only contain letters")
      .escape(),

    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last Name is required")
      .isAlpha()
      .withMessage("Last Name should only contain letters")
      .escape(),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Enter a valid email")
      .normalizeEmail(),

    body("password")
      .trim()
      .matches(passwordRegex)
      .withMessage(
        "Password must be at least 8 characters, include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&)"
      )
      .escape(),
  ],
  sanitizeInput,
  registerUser
);

router.post(
  "/login",
  [
    body("identity")
      .trim()
      .notEmpty()
      .withMessage("Identity (email or phone number) is required")
      .escape(),

    body("password")
      .trim()
      .matches(passwordRegex)
      .withMessage(
        "Password must be at least 8 characters, include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&)"
      )
      .escape(),
  ],
  sanitizeInput,
  loginUser
);

router.post("/logout", logoutUser);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);

// =========GOOGLE SIGN-IN AUTH=============
router.get("/google", (req, res, next) => {
  const intent = req.query.intent;

  req.session.authIntent = intent;

  passport.authenticate("google", {
    state: intent,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res, next) => {
    if (!req.user)
      return next({ statusCode: 401, message: "Authentication failed" });

    const intent = req.query.state || "auth";

    if (intent === "connect") {
      return responseHandler(
        res,
        null,
        "Google account connected successfully"
      );
    } else {
      const user = await getUserByGoogleID(req.user.googleId);
      const token = generateToken(user.id);
      const frontendURL = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
      return res.redirect(frontendURL);
    }
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
