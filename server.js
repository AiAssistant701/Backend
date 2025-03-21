// External Imports
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import morgan from "morgan";
import express from "express";
import passport from "passport";
import session from "express-session";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Internal Imports
import connectDB from "./config/db.js";
import apiRoutes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import {
  googleStrategyConfig,
  handleGoogleAuth,
} from "./utils/strategy/googleStrategy.js";
import './utils/cron-jobs/emailAutoReply.js'

dotenv.config();

const app = express();

connectDB();

// Trust Proxy (for rate limiting behind proxies)
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
];

// ======================
// Middleware Setup
// ======================
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Handle Preflight Requests for CORS
app.options("*", cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// ======================
// Passport Configuration
// ======================
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy(googleStrategyConfig, handleGoogleAuth));

// Serialize and Deserialize User
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// ========GOOGLE LOGIN TEST=========
app.get("/", (req, res) => {
  res.send("<a href='/api/v1/auth/google?intent=connect'>Login with Google</a>");
});

// ======================
// Routes
// ======================
app.use("/api", apiRoutes);

// ======================
// Error Handling
// ======================
app.use(errorHandler);

// Export the Express App
export default app;
