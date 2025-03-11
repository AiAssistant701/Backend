import axios from "axios";
import dotenv from "dotenv";
import { getModelForTask } from "../utils/modelRouter.js";
import { extractEmailDetails } from "../utils/helpers.js";
import { classifyIntent } from "../utils/intentClassifier.js";
import {
  createTaskHistory,
  updateTaskToCompleted,
} from "../usecases/taskHistory.js";
import responseHandler from "../middlewares/responseHandler.js";
import { aiOrchestrator } from "../services/aiOrchestratorService.js";
import { extractEventDetails } from "../utils/extractEventDetails.js";
import {
  SEND_EMAIL,
  MEETING_SCHEDULING,
  QUICK_ANSWERS,
  UPLOAD_FILE,
  FILE_RETRIEVAL,
  REPORT_GENERATION,
  MARKET_RESEARCH,
  FINANCE_ANALYSIS
} from "../utils/constants.js";

dotenv.config();

const handleAIRequest = async (req, res, next) => {
  try {
    let user = req.user,
      selectedProvider;
    const { provider, prompt } = req.body;

    const taskType = await classifyIntent(prompt);
    console.log("taskType", taskType);

    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const geminiApiPayload = {
      contents: [
        {
          parts: [
            {
              text: `Generate a  brief and concise description for this user's prompt. Use this format 'Asked about this question', 'Sent email to to johndoe@yahoo.com': ${prompt}`,
            },
          ],
        },
      ],
    };
    const headers = { "Content-Type": "application/json" };
    const response = await axios.post(geminiApiUrl, geminiApiPayload, {
      headers,
    });

    const description = response.data.candidates?.[0]?.content.parts[0].text;

    const taskHistory = await createTaskHistory(
      user.id,
      taskType,
      description,
      prompt
    );

    selectedProvider = provider;
    if (!provider) {
      selectedProvider = getModelForTask(taskType);
    }
    console.log("selectedProvider", selectedProvider);

    let payload = {
      userId: user.id,
      provider: selectedProvider,
      googleId: user.googleId,
    };

    switch (taskType) {
      case SEND_EMAIL:
        const emailDetails = extractEmailDetails(prompt);
        if (!emailDetails) {
          return next({
            statusCode: 400,
            message: "Could not extract email details.",
          });
        }

        payload = { ...payload, ...emailDetails };

        break;

      case MEETING_SCHEDULING:
        const eventDetails = await extractEventDetails(prompt);
        console.log("eventDetails", eventDetails);
        if (!eventDetails) {
          return next({
            statusCode: 400,
            message: "Could not extract event details.",
          });
        }

        payload = { ...payload, eventDetails };

        break;

      case QUICK_ANSWERS:
        payload = { ...payload, query: prompt };

        break;

      case UPLOAD_FILE:
      case FINANCE_ANALYSIS:
        if (!req.file) {
          return next({ statusCode: 400, message: "No file uploaded." });
        }

        // Attach file details to payload
        payload = {
          ...payload,
          filePath: req.file.path,
          fileName: req.file.originalname,
        };

        break;

      case FILE_RETRIEVAL:
        payload = { ...payload, query: prompt };

        break;

      case REPORT_GENERATION:
        payload = { ...payload, query: `Generate a report for ${prompt}` };

        break;

      case MARKET_RESEARCH:
        payload = { ...payload, query: prompt };

        break;
    }

    const result = await aiOrchestrator(taskType, payload);

    await updateTaskToCompleted(taskHistory._id);
    return responseHandler(res, result, "AI Task Processed Successfully");
  } catch (error) {
    next(error);
  }
};

export { handleAIRequest };
