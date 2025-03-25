import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Database Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;
