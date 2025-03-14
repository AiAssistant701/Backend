import { classifyIntent } from "./intentClassifier.js";
import { getModelForTask } from "./modelRouter.js";
import { extractEventDetails } from "./extractEventDetails.js";
import { aiOrchestrator } from "../services/aiOrchestratorService.js";
import { generateTaskDescription, extractEmailDetails } from "./helpers.js";
import {
  createTaskHistory,
  updateTaskToCompleted,
} from "../usecases/taskHistory.js";
import {
  SEND_EMAIL,
  MEETING_SCHEDULING,
  QUICK_ANSWERS,
  UPLOAD_FILE,
  FINANCE_ANALYSIS,
  FILE_RETRIEVAL,
  REPORT_GENERATION,
  MARKET_RESEARCH,
} from "./constants.js";

// =======================
// Processes a user request and determines appropriate AI action
// =======================
export const processUserRequest = async ({
  userId,
  prompt,
  provider,
  googleId,
  file,
}) => {
  const taskType = await classifyIntent(prompt);
  console.log("taskType", taskType)

  const description = await generateTaskDescription(prompt);

  const taskHistory = await createTaskHistory(
    userId,
    taskType,
    description,
    prompt
  );

  const selectedProvider = provider || getModelForTask(taskType);

  const payload = await buildPayloadForTask({
    taskType,
    prompt,
    userId,
    googleId,
    selectedProvider,
    file,
  });

  const result = await aiOrchestrator(taskType, payload);

  await updateTaskToCompleted(taskHistory._id);

  return {
    result,
    taskHistory,
  };
};

// =======================
// Builds task-specific payload based on task type
// =======================
const buildPayloadForTask = async ({
  taskType,
  prompt,
  userId,
  googleId,
  selectedProvider,
  file,
}) => {
  let payload = {
    userId,
    provider: selectedProvider,
    googleId,
  };

  switch (taskType) {
    case SEND_EMAIL:
      const emailDetails = extractEmailDetails(prompt);
      if (!emailDetails) {
        throw new Error("Could not extract email details");
      }
      return { ...payload, ...emailDetails };

    case MEETING_SCHEDULING:
      const eventDetails = await extractEventDetails(prompt);
      if (!eventDetails) {
        throw new Error("Could not extract event details");
      }
      return { ...payload, eventDetails };

    case QUICK_ANSWERS:
    case FILE_RETRIEVAL:
    case MARKET_RESEARCH:
      return { ...payload, query: prompt };

    case REPORT_GENERATION:
      return {
        ...payload,
        query: `Generate a report for ${prompt}`,
      };

    case UPLOAD_FILE:
    case FINANCE_ANALYSIS:
      if (!file) {
        throw new Error("File is required for this task type");
      }
      return {
        ...payload,
        filePath: file.path,
        fileName: file.originalname,
      };

    default:
      return { ...payload, query: prompt };
  }
};
