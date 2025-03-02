import { processMessage } from "./messagingService.js";
import { analyzeBankStatement } from "./financeService.js";
import { chatbotService } from "./chatbotService.js";
import { performMarketResearch } from "./research/marketResearch.js";
import {
  createCalendarEvent,
  getUpcomingEvents,
} from "../integrations/googleCalenderService.js";
import {
  sendEmail,
  getUnreadEmails,
  searchEmails,
  summarizeUnreadEmails,
} from "../integrations/gmailService.js";
import {
  uploadFileToGoogleDrive,
  getGoogleDriveFiles,
  organizeFilesInDrive,
} from "../integrations/files/googleDriveService.js";
import {
  trackProgress,
  provideHealthReminders,
} from "./productivityService.js";
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

// AI Orchestrator - Determines the AI Task & Routes to Correct Service
export const aiOrchestrator = async (taskType, payload) => {
  let result, modelUsed, decisionScore, reasoning;
  const startTime = Date.now(); // Start time for execution tracking

  try {
    switch (taskType) {
      case RESEARCH_ANALYSIS:
        modelUsed = "Hugging Face BART";
        reasoning = "Best model for research paper summarization.";
        result = await processResearchPaper(payload);
        decisionScore = 0.95;
        break;

      case MESSAGE_PROCESSING:
        modelUsed = "GPT-4 Turbo";
        reasoning = "GPT-4 is optimal for conversational context.";
        result = await processMessage(payload);
        decisionScore = 0.92;
        break;

      case FINANCE_ANALYSIS:
        modelUsed = "Hugging Face FinBERT";
        reasoning = "FinBERT provides the best financial insights.";
        result = await analyzeBankStatement(payload);
        decisionScore = 0.97;
        break;

      case UPLOAD_FILE:
        modelUsed = "Google Drive API";
        reasoning = "Using Google Drive API for file storage.";
        result = await uploadFileToGoogleDrive(
          payload.googleId,
          payload.filePath,
          payload.fileName
        );
        decisionScore = 1.0;
        break;

      case FILE_RETRIEVAL:
        modelUsed = "Google Drive API";
        reasoning = "Using Google Drive API for retrieving files.";
        result = await getGoogleDriveFiles(payload.googleId, payload.query);
        decisionScore = 1.0;
        break;

      case ORGANIZE_FILES:
        modelUsed = "AI Classifier + Google Drive API";
        reasoning = "Using AI to auto-classify files.";
        result = await organizeFilesInDrive(payload.googleId);
        decisionScore = 0.95;
        break;

      case SEND_EMAIL:
        modelUsed = "Google Gemma + Gmail API";
        reasoning = "Gemma composes email, Gmail API sends it.";
        result = await sendEmail(
          payload.googleId,
          payload.to,
          payload.subject,
          payload.message
        );
        decisionScore = 0.94;
        break;

      case FETCH_UNREAD_EMAILS:
        modelUsed = "Gmail API";
        reasoning = "Fetching emails directly from Gmail API.";
        result = await getUnreadEmails(payload.googleId);
        decisionScore = 1.0;
        break;

      case SEARCH_EMAILS:
        modelUsed = "Gmail API";
        reasoning = "Gmail API provides the fastest search results.";
        result = await searchEmails(payload.googleId, payload.query);
        decisionScore = 1.0;
        break;

      case SUMMARIZE_EMAILS:
        modelUsed = "Hugging Face BART";
        reasoning = "Best model for email summarization.";
        result = await summarizeUnreadEmails(payload.googleId);
        decisionScore = 0.96;
        break;

      case MEETING_SCHEDULING:
        modelUsed = "Google Calendar API";
        reasoning = "Google Calendar API is optimal for scheduling.";
        result = await createCalendarEvent(
          payload.googleId,
          payload.eventDetails
        );
        decisionScore = 1.0;
        break;

      case FETCH_UPCOMING_EVENTS:
        modelUsed = "Google Calendar API";
        reasoning = "Google API fetches the most accurate upcoming events.";
        result = await getUpcomingEvents(payload.googleId);
        decisionScore = 1.0;
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
        result = await chatbotService(taskType, payload.query);
        decisionScore = 0.98;
        break;

      case REPORT_GENERATION:
        modelUsed = "Google Gemma + Pinecone";
        reasoning = "Efficient model for real-time responses.";
        result = await chatbotService(taskType, payload.query);
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
        result = await provideHealthReminders(payload);
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

    return result;
  } catch (error) {
    console.error("AI Orchestrator Error:", error);
    throw error;
  }
};
