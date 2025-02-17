import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../server.js";
import User from "../models/User.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Close existing connection before reconnecting
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("Auth API", () => {
  let userData = {
    name: "Test User",
    firstName: "John",
    lastName: "Doe",
    email: "test@example.com",
    password: "Test1234",
  };

  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/signup").send(userData);    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("_id");
    expect(res.body.data).toHaveProperty("email", userData.email);
  });

  it("should not register a user with an existing email", async () => {
    const res = await request(app).post("/api/auth/signup").send(userData);
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message", "User already exists");
  });

  it("should not register a user with invalid email", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "Invalid User",
      email: "invalid-email",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("success", false);
  });

  it("should login with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identity: userData.email, password: userData.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("_id");
    expect(res.body.data).toHaveProperty("email", userData.email);
  });

  it("should not login with incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identity: userData.email, password: "wrongpassword" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message", "Invalid email or password");
  });

  it("should logout user", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("message", "Logged out successfully");
  });
});

describe("Password Reset API", () => {
  let user, resetToken;
  beforeAll(async () => {
    // Create a test user
    user = await User.create({
      name: "Test User",
      firstName: "John",
    lastName: "Doe",
      email: "test1@example.com",
      password: "Password123!",
    });

    // Generate a reset token
    resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  });

  afterAll(async () => {});

  it("Should reject invalid token", async () => {
    const response = await request(app)
      .post("/api/auth/reset-password/invalidtoken")
      .send({ newPassword: "NewPassword123!" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid or malformed token");
  });

  it("Should reset password successfully", async () => {
    const response = await request(app)
      .post(`/api/auth/reset-password/${resetToken}`)
      .send({ newPassword: "NewPassword123!" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Password reset successful");

    // Verify that the password was hashed and updated
    const updatedUser = await User.findById(user._id);
    const isMatch = await bcrypt.compare(
      "NewPassword123!",
      updatedUser.password
    );
    expect(isMatch).toBe(true);
  });

  it("Should reject expired token", async () => {
    // Generate an expired token
    const expiredToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "-1s", // Expired immediately
      }
    );

    const response = await request(app)
      .post(`/api/auth/reset-password/${expiredToken}`)
      .send({ newPassword: "AnotherPassword123!" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Token has expired");
  });
});
