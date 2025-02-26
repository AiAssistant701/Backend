import mongoose from "mongoose";

const AIDecisionLogSchema = new mongoose.Schema(
  {
    taskType: { type: String, required: true },
    modelUsed: { type: String, required: true },
    decisionScore: { type: Number, required: true },
    reasoning: { type: String, required: true },
    executionTime: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const AIDecisionLog = mongoose.model("AIDecisionLog", AIDecisionLogSchema);

export default AIDecisionLog;
