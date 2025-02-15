import User from "../models/User.js";
import jwt from "jsonwebtoken";
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
