import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { transporter } from "../config/emailTransport.js";
import { validationResult } from "express-validator";
import responseHandler from "../middlewares/responseHandler.js";

// Generate JWT Token
const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Generate JWT Token for password reset (expires in 1 hour)
const generateResetToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
export const registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next({ statusCode: 400, message: errors.array()[0].msg });
  }

  const { name, email, password, role } = req.body;

  try {
    let userExists = await User.findOne({ email });

    if (userExists) {
      return next({ statusCode: 400, message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",
    });

    if (user) {
      generateToken(res, user._id);
      responseHandler(
        res,
        { _id: user._id, name: user.name, email: user.email },
        "User registered",
        201
      );
    } else {
      return next({ statusCode: 400, message: "Invalid user data" });
    }
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      generateToken(res, user._id);
      responseHandler(
        res,
        { _id: user._id, name: user.name, email: user.email },
        "User logged in"
      );
    } else {
      return next({ statusCode: 401, message: "Invalid email or password" });
    }
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/logout
// @desc    Logout user
export const logoutUser = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  responseHandler(res, null, "Logged out successfully");
};

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
export const requestPasswordReset = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next({ statusCode: 404, message: "User not found" });
    }

    const resetToken = generateResetToken(user._id);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });

    responseHandler(res, null, "Password reset link sent to email");
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/reset-password/:token
// @desc    Reset user password
export const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next({ statusCode: 400, message: "Invalid or expired token" });
    }

    user.password = newPassword;
    await user.save();

    responseHandler(res, null, "Password reset successful");
  } catch (error) {
    next(error);
  }
};
