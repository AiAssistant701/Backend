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
import { saveUserTokens, updateUserWithTokens } from "./usecases/users.js";

dotenv.config();

const app = express();

connectDB();

// Trust Proxy (for rate limiting behind proxies)
app.set("trust proxy", 1);

// ======================
// Middleware Setup
// ======================
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(cookieParser());

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
    saveUninitialized: true,
  })
);

// ======================
// Passport Configuration
// ======================
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_API}/api/v1/auth/google/callback`,
      scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
         "https://www.googleapis.com/auth/calendar.events"
      ],
      access_type: "offline",
      prompt: "consent"
    },
    async (accessToken, refreshToken, profile, done) => {
      const userData = {
        googleId: profile.id,
        email: profile.emails[0].value,
        tokens: { accessToken, refreshToken }
      };
      const userTokens = await saveUserTokens(profile.id, userData.tokens);

      if(!userTokens) {
        await updateUserWithTokens(profile.emails[0].value, profile.id, userData.tokens)
      }

      return done(null, userData);
    }
  )
);

// Serialize and Deserialize User
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// ========GOOGLE LOGIN TEST=========
app.get("/", (req, res) => {
  res.send("<a href='/api/auth/google'>Login with Google</a>");
});

// ======================
// Routes
// ======================
app.use('/api', apiRoutes)

// ======================
// Error Handling
// ======================
app.use(errorHandler);

// Export the Express App
export default app;
