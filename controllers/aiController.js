import { userIntent } from "../services/userIntentService.js";
import responseHandler from "../middlewares/responseHandler.js";
import { aiOrchestrator } from "../services/aiOrchestratorService.js";
import { extractEmailDetails, extractEventDetails } from "../utils/helpers.js";

const handleAIRequest = async (req, res, next) => {
  try {
    let user = req.user;
    const { text } = req.body;
    // example text: Send an email to johndoe@example.com subject Meeting Update message The meeting is at 3 PM.
    const taskType = await userIntent(text);
    console.log("taskType", taskType);

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
    } else if (taskType === "meeting_scheduling") {
      const eventDetails = await extractEventDetails(text);
      console.log("eventDetails", eventDetails);
      if (!eventDetails) {
        return next({
          statusCode: 400,
          message: "Could not extract event details.",
        });
      }

      payload = { ...payload, eventDetails };
    } else if (taskType === "quick_answers") {
      payload = { ...payload, query: text };
    } else if (taskType === "upload_file") {
      if (!req.file) {
        return next({ statusCode: 400, message: "No file uploaded." });
      }

      // Attach file details to payload
      payload = {
        ...payload,
        filePath: req.file.path,
        fileName: req.file.originalname,
      };
    } else if (taskType === "retrieve_file") {
      payload = { ...payload, query: text }; // Pass query for file search
    }

    const result = await aiOrchestrator(taskType, payload);
    return responseHandler(res, result, "AI Task Processed Successfully");
  } catch (error) {
    next(error);
  }
};

export { handleAIRequest };
