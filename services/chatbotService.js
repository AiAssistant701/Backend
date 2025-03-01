import axios from "axios";

export const chatbotService = async (taskType, query) => {
  // Implement quick answer retrieval from AI models
  const response = await axios.post(`${process.env.PYTHON_AI_URL}/qa/`, {
    question: query,
  });

  return { message: taskType, response: response.data.answer };
};
