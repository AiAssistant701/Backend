import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { transporter } from "../config/emailTransport.js";
import { validationResult } from "express-validator";
import responseHandler from "../middlewares/responseHandler.js";
import { emailRegex, passwordRegex } from "../utils/constants.js";

// Generate JWT Token
export const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return token;
};

// Generate JWT Token for password reset (expires in 1 hour)
const generateResetToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
export const registerUser = async (req, res, next) => {
  let user;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next({ statusCode: 400, message: errors.array()[0].msg });
  }

  const { firstName, lastName, email, password, role } = req.body;

  try {
    let userExists = await User.findOne({ email });

    if (userExists) {
      return next({ statusCode: 400, message: "User already exists" });
    }

    user = await User.create({
      name: `${firstName} ${lastName}` || "User",
      firstName,
      lastName,
      email,
      password,
      role: role || "user",
    });

    if (user) {
      user = user.toJSON();
      jwt.sign(
        {
          id: user.id,
        },
        process.env.EMAIL_JWT_SECRET,
        {
          expiresIn: "1d",
        },
        (err, emailToken) => {
          url = `http://localhost:5000/api/auth/verify-email/${emailToken}`;
          const mailOptions = {
            from: "danielidowu414@gmail.com",
            to: "jorovod391@nastyx.com", // change to dynamic email (email)
            subject: "Welcome to AI-Auto!",
            html: `Welcome <b>${firstName}</b>,
              Kindly confirm your email <a href=${url} target='_blank'>here</a>
              `,
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              return next({ statusCode: 400, message: error });
            }
          });
        }
      );

      return responseHandler(
        res,
        { id: user.id, name: user.name, email: user.email },
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
  let user;
  const { identity, password } = req.body;

  try {
    if (!identity || !password) {
      return next({
        statusCode: 400,
        message: "Identity or password is required!",
      });
    }

    const isEmail = emailRegex.test(identity);
    const userField = isEmail ? "email" : "phoneNumber";

    user = await User.findOne({ [userField]: identity });

    if (user && (await user.matchPassword(password))) {
      if (!user.emailVerified) {
        return next({
          statusCode: 401,
          message: "Please confirm your email to login!",
        });
      }
      user = user.toJSON();

      const token = generateToken(user.id);
      return responseHandler(
        res,
        { id: user.id, name: user.name, email: user.email, token },
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
  return responseHandler(res, null, "Logged out successfully");
};

// @route   GET /api/auth/verify-email/:token
// @desc    Verify a user's email
export const verifyEmail = async (req, res, next) => {
  const { token } = req.params;
  jwt.verify(token, process.env.EMAIL_JWT_SECRET, async (err, user) => {
    if (err) {
      return next({ statusCode: 400, message: "Invalid email token!" });
    }

    await User.findByIdAndUpdate(user.id, {
      $set: { emailVerified: true },
    });

    return responseHandler(res, null, "Your account has been confirmed!", 201);
  });

  res.redirect(process.env.FRONTEND_URL)
};

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
export const requestPasswordReset = async (req, res, next) => {
  let user;
  const { email } = req.body;

  try {
    user = await User.findOne({ email });

    if (!user) {
      return next({ statusCode: 404, message: "User not found" });
    }

    user = user.toJSON();

    const resetToken = generateResetToken(user.id);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });

    return responseHandler(res, null, "Password reset link sent to email");
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

    return responseHandler(res, null, "Password reset successful");
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next({ statusCode: 400, message: "Invalid or malformed token" });
    } else if (error.name === "TokenExpiredError") {
      return next({ statusCode: 400, message: "Token has expired" });
    }
    next(error);
  }
};
