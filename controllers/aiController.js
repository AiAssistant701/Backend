import { aiOrchestrator } from "../services/aiOrchestratorService";
import responseHandler from "../middlewares/responseHandler";

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
