import { aiOrchestrator } from "../services/aiOrchestratorService.js";
import responseHandler from "../middlewares/responseHandler.js";
import { userIntent } from "../services/userIntentService.js";
import { extractEmailDetails } from "../utils/helpers.js";

const handleAIRequest = async (req, res, next) => {
  try {
    let user = req.user;
    const { text } = req.body;
    // example text: Send an email to johndoe@example.com subject Meeting Update message The meeting is at 3 PM.
    const taskType = await userIntent(text);

    let payload = {
      googleId: user.googleId,
    };

    if (taskType === "send_email") {
      const emailDetails = extractEmailDetails(text);
      if (!emailDetails) {
        return next({
          statusCode: 400,
          message: "Could not extract email details.",
        });
      }

      payload = { ...payload, ...emailDetails };
    }

    const result = await aiOrchestrator(taskType, payload);
    return responseHandler(res, result, "AI Task Processed Successfully");
  } catch (error) {
    next(error);
  }
};

export { handleAIRequest };
