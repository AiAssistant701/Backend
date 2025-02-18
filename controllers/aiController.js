import { aiOrchestrator } from "../services/aiOrchestratorService.js";
import responseHandler from "../middlewares/responseHandler.js";

const handleAIRequest = async (req, res, next) => {
  try {
    const { taskType, payload } = req.body;
    const result = await aiOrchestrator(taskType, payload);
    return responseHandler(res, result, "AI Task Processed Successfully");
  } catch (error) {
    next(error);
  }
};

export { handleAIRequest };
