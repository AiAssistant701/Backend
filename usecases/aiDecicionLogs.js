import logger from "../utils/logger.js";
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
    logger.error("Error logging AI decision:", error);
  }
};
