import dotenv from "dotenv";
import express from "express";
import passport from "passport";
import crypto from 'crypto'
import User from "../../models/User.js";
import { body } from "express-validator";
import logger from "../../utils/logger.js";
import { getUserByEmail } from "../../usecases/users.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  generateToken,
} from "../../controllers/authController.js";
import {
  getMicrosoftProfile,
  getMicrosoftTokens,
} from "../../integrations/microsoft/microsoftAuth.js";
import { passwordRegex } from "../../utils/constants.js";
import { getUserByGoogleID } from "../../usecases/users.js";
import verifyToken from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/rolesMiddleware.js";
import responseHandler from "../../middlewares/responseHandler.js";
import { sanitizeInput } from "../../middlewares/sanitizeInput.js";

dotenv.config();

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

  const authorizationURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.BACKEND_API}/api/v1/auth/google/callback&scope=openid profile email https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file&access_type=offline&prompt=consent&state=${intent}`;

  res.redirect(authorizationURL);
});

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res, next) => {
    if (!req.user)
      return next({
        statusCode: 401,
        message: req.authInfo?.message || "Authentication failed",
      });

    const intent = req.query.state || "auth";

    if (intent === "connect") {
      const frontendURL = `${process.env.FRONTEND_URL}/user/profile/google-confirmation`;
      return res.redirect(frontendURL);
    } else {
      const user = await getUserByGoogleID(req.user.googleAuth.googleId);
      const token = generateToken(user.id);
      const frontendURL = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
      return res.redirect(frontendURL);
    }
  }
);

// =========MICROSOFT SIGN-IN AUTH=============
router.get("/microsoft", (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.microsoftState = state;
  
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${
    new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      response_type: 'code',
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
      scope: 'User.Read',
      state: state,
      prompt: 'select_account'
    })
  }`;
  
  console.log(`Initiating Microsoft auth with state: ${state}`);
  res.redirect(authUrl);
});

// Callback handler with state verification
router.get("/microsoft/callback", async (req, res) => {
  try {
    console.log("Received callback with state:", req.query.state);
    console.log("Session state:", req.session.microsoftState);

    // Verify state
    if (!req.query.state || req.query.state !== req.session.microsoftState) {
      throw new Error('State verification failed');
    }

    // Clear the state after verification
    delete req.session.microsoftState;

    // Handle the OAuth code
    const { code } = req.query;
    if (!code) throw new Error('No authorization code received');

    const tokens = await getMicrosoftTokens(code);
    console.log("Token exchange successful");

    const profile = await getMicrosoftProfile(tokens.access_token);
    const user = await getUserByEmail(profile?.mail);
    console.log("user", user)
    
    const redirectUrl = new URL(process.env.FRONTEND_URL);
    redirectUrl.searchParams.set("microsoft_auth", "success");
    res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error("Microsoft OAuth error:", error);
    const errorUrl = new URL(`${process.env.FRONTEND_URL}/auth-error`);
    errorUrl.searchParams.set("code", "microsoft_failure");
    errorUrl.searchParams.set("reason", error.message.includes('state') ? 'state_mismatch' : 'auth_error');
    res.redirect(errorUrl.toString());
  }
});

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
