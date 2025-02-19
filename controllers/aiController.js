import { aiOrchestrator } from "../services/aiOrchestratorService.js";
import responseHandler from "../middlewares/responseHandler.js";
import { userIntent } from "../services/userIntentService.js";

const handleAIRequest = async (req, res, next) => {
  try {
    const { payload } = req.body;
    const taskType = await userIntent(payload);

    const result = await aiOrchestrator(taskType, payload);
    return responseHandler(res, result, "AI Task Processed Successfully");
  } catch (error) {
    next(error);
  }
};

export { handleAIRequest };
