import mongoose from "mongoose";

const taskHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    prompt: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

const TaskHistory = mongoose.model("TaskHistory", taskHistorySchema);

export default TaskHistory;
