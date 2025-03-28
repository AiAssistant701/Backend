import logger from "../utils/logger.js";
import { chatbotService } from "./chatbotService.js";
import { analyzeFinance } from "./financeService.js";
import { performMarketResearch } from "./research/marketResearch.js";
import { handleHealthReminder } from "../utils/cron-jobs/healthReminders.js";
import { trackProgress } from "./productivityService.js";
import {
  EMAIL_PROVIDERS,
  CALENDAR_PROVIDERS,
  FILE_PROVIDERS,
} from "../utils/providerMapping.js";
import {
  RESEARCH_ANALYSIS,
  MESSAGE_PROCESSING,
  UPLOAD_FILE,
  FILE_RETRIEVAL,
  ORGANIZE_FILES,
  FINANCE_ANALYSIS,
  SEND_EMAIL,
  FETCH_UNREAD_EMAILS,
  SEARCH_EMAILS,
  SUMMARIZE_EMAILS,
  MEETING_SCHEDULING,
  FETCH_UPCOMING_EVENTS,
  MARKET_RESEARCH,
  QUICK_ANSWERS,
  REPORT_GENERATION,
  PROGRESS_TRACKING,
  HEALTH_REMINDERS,
} from "../utils/constants.js";
import { logAIDecision } from "../usecases/aiDecicionLogs.js";
import { getSubagentConfig } from "../usecases/subagentConfig.js";

// AI Orchestrator - Determines the AI Task & Routes to Correct Service
export const aiOrchestrator = async (taskType, payload) => {
  const { userId } = payload;
  let result, modelUsed, decisionScore, reasoning;
  const startTime = Date.now(); // Start time for execution tracking

  try {
    const subagentConfig = await getSubagentConfig(userId, taskType);
    const provider = subagentConfig.config.provider;

    switch (taskType) {
      case SEND_EMAIL:
      case FETCH_UNREAD_EMAILS:
      case SEARCH_EMAILS:
      case SUMMARIZE_EMAILS:
        modelUsed = `${provider} API`;
        logger.info("Provider Used: " + modelUsed);
        reasoning = `Using ${provider} API for email-related tasks.`;
        const emailService = EMAIL_PROVIDERS[provider];
        if (!emailService) {
          throw new Error(`Unsupported email provider: ${provider}`);
        }
        switch (taskType) {
          case SEND_EMAIL:
            result = await emailService.sendEmail(payload);
            decisionScore = 0.94;
            break;
          case FETCH_UNREAD_EMAILS:
            result = await emailService.getUnreadEmails(payload);
            decisionScore = 1.0;
            break;
          case SEARCH_EMAILS:
            result = await emailService.searchEmails(payload);
            decisionScore = 1.0;
            break;
          case SUMMARIZE_EMAILS:
            result = await emailService.summarizeEmails(payload);
            decisionScore = 0.96;
            break;
        }
        break;

      case MEETING_SCHEDULING:
      case FETCH_UPCOMING_EVENTS:
        modelUsed = `${provider} API`;
        logger.info("Provider Used: " + modelUsed);
        reasoning = `Using ${provider} API for calendar-related tasks.`;
        const calendarService = CALENDAR_PROVIDERS[provider];
        if (!calendarService) {
          throw new Error(`Unsupported calendar provider: ${provider}`);
        }
        switch (taskType) {
          case MEETING_SCHEDULING:
            result = await calendarService.createEvent(payload);
            decisionScore = 1.0;
            break;
          case FETCH_UPCOMING_EVENTS:
            result = await calendarService.getUpcomingEvents(payload);
            decisionScore = 1.0;
            break;
        }
        break;

      case UPLOAD_FILE:
      case FILE_RETRIEVAL:
      case ORGANIZE_FILES:
        modelUsed = `${provider} API`;
        logger.info("Provider Used: " + modelUsed);
        reasoning = `Using ${provider} API for file-related tasks.`;
        const fileService = FILE_PROVIDERS[provider];
        if (!fileService) {
          throw new Error(`Unsupported file provider: ${provider}`);
        }
        switch (taskType) {
          case UPLOAD_FILE:
            result = await fileService.uploadFile(payload);
            decisionScore = 1.0;
            break;
          case FILE_RETRIEVAL:
            result = await fileService.getFiles(payload);
            decisionScore = 1.0;
            break;
          case ORGANIZE_FILES:
            result = await fileService.organizeFiles(payload);
            decisionScore = 0.95;
            break;
        }
        break;

      case RESEARCH_ANALYSIS:
        modelUsed = "Hugging Face BART";
        reasoning = "Best model for research summarization.";
        result = await chatbotService(taskType, payload);
        decisionScore = 0.95;
        break;

      case MESSAGE_PROCESSING:
        modelUsed = "GPT-4 Turbo";
        reasoning = "GPT-4 is optimal for conversational context.";
        result = await chatbotService(taskType, payload);
        decisionScore = 0.92;
        break;

      case FINANCE_ANALYSIS:
        modelUsed = "Hugging Face FinBERT";
        reasoning = "FinBERT provides the best financial insights.";
        result = await analyzeFinance(payload.filePath, payload.userId);
        decisionScore = 0.97;
        break;

      case MARKET_RESEARCH:
        modelUsed = "Hugging Face NLP";
        reasoning = "AI research model used for trend analysis.";
        result = await performMarketResearch(payload);
        decisionScore = 0.93;
        break;

      case QUICK_ANSWERS:
        modelUsed = "Google Gemma + Pinecone";
        reasoning = "Efficient model for real-time responses.";
        result = await chatbotService(taskType, payload);
        decisionScore = 0.98;
        break;

      case REPORT_GENERATION:
        modelUsed = "Google Gemma + Pinecone";
        reasoning = "Efficient model for real-time responses.";
        result = await chatbotService(taskType, payload);
        decisionScore = 0.95;
        break;

      case PROGRESS_TRACKING:
        modelUsed = "Pinecone Vector Search";
        reasoning = "AI tracks progress using memory embeddings.";
        result = await trackProgress(payload);
        decisionScore = 0.96;
        break;

      case HEALTH_REMINDERS:
        modelUsed = "Health API + AI NLP";
        reasoning = "Health API for fitness tracking & AI reminders.";
        result = await handleHealthReminder(payload.query, payload.userId);
        decisionScore = 0.97;
        break;

      default:
        throw { statusCode: 400, message: "Invalid AI Task Type" };
    }

    // Calculate execution time
    const executionTime = Date.now() - startTime;

    // Log AI decision to MongoDB
    await logAIDecision(
      taskType,
      modelUsed,
      decisionScore,
      reasoning,
      executionTime
    );

    logger.info("Result: " + result);

    return result;
  } catch (error) {
    logger.error("AI Orchestrator Error: " + error);
    throw error;
  }
};
