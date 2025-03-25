import logger from "../utils/logger.js";
import { callAIModel } from "../utils/models.js";

export const chatbotService = async (taskType, payload) => {
  const response = await callAIModel(
    payload.userId,
    payload.provider,
    payload.query
  );

  logger.info("AI response", response);

  return { message: taskType, response: response };
};
