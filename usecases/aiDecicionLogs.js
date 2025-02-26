import AIDecisionLog from "../models/AIDecisionLogs.js";

export const logAIDecision = async (
  taskType,
  modelUsed,
  decisionScore,
  reasoning,
  executionTime
) => {
  try {
    await AIDecisionLog.create({
      taskType,
      modelUsed,
      decisionScore,
      reasoning,
      executionTime,
    });
  } catch (error) {
    console.error("Error logging AI decision:", error);
  }
};
