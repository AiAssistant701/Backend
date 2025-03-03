import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const apiKeySchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },
    key: { type: String, required: true },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    phoneNumber: {
      type: String,
      index: true,
      sparse: true,
    },
    googleId: {
      type: String,
    },
    apiKeys: [apiKeySchema],
    tokens: {
      access_token: { type: String },
      refresh_token: { type: String },
    },
    phoneNumberVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
      },
    },
  }
);

// Hash password before saving user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
