import axios from "axios";
import { callAIModel } from "../utils/models.js";

export const chatbotService = async (taskType, payload) => {
  const response = await callAIModel(
    payload.userId,
    payload.provider,
    payload.query
  );

  console.log("AI response", response);

  // Implement quick answer retrieval from AI models
  // const response = await axios.post(`${process.env.PYTHON_AI_URL}/qa/`, {
  //   question: query,
  // });

  return { message: taskType, response: response };
};
