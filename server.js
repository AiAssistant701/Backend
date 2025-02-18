import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import {
  authRoutes,
  userRoutes,
  chatRoutes,
  dashboardRoutes,
  memoryRoutes,
  whatsappRoutes,
  aiRoutes
} from "./routes/index.js";
import rateLimit from "express-rate-limit";
import errorHandler from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(cookieParser());

// Connect to Database
connectDB();

app.set("trust proxy", 1)

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

app.use(limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/ai", aiRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
