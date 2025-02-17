import { processResearchPaper } from "./researchService.js";
import { processMessage } from "./messagingService.js";
import { organizeFiles } from "./fileService.js";
import { analyzeBankStatement } from "./financeService.js";
import { manageEmailInbox, scheduleMeetings } from "./messagingService.js";
import { retrieveFiles } from "./fileService.js";
import { performResearch, provideQuickAnswers } from "./researchService.js";
import {
  generateReports,
  trackProgress,
  provideHealthReminders,
} from "./productivityService.js";
import {
  RESEARCH_ANALYSIS,
  MESSAGE_PROCESSING,
  FILE_MANAGEMENT,
  FINANCE_ANALYSIS,
  EMAIL_MANAGEMENT,
  MEETING_SCHEDULING,
  FILE_RETRIEVAL,
  MARKET_RESEARCH,
  QUICK_ANSWERS,
  REPORT_GENERATION,
  PROGRESS_TRACKING,
  HEALTH_REMINDERS,
} from "../utils/constants.js";

// AI Orchestrator - Determines the AI Task & Routes to Correct Service
export const aiOrchestrator = async (taskType, payload) => {
  switch (taskType) {
    case RESEARCH_ANALYSIS:
      return await processResearchPaper(payload);

    case MESSAGE_PROCESSING:
      return await processMessage(payload);

    case FILE_MANAGEMENT:
      return await organizeFiles(payload);

    case FINANCE_ANALYSIS:
      return await analyzeBankStatement(payload);

    case EMAIL_MANAGEMENT:
      return await manageEmailInbox(payload);

    case MEETING_SCHEDULING:
      return await scheduleMeetings(payload);

    case FILE_RETRIEVAL:
      return await retrieveFiles(payload);

    case MARKET_RESEARCH:
      return await performResearch(payload);

    case QUICK_ANSWERS:
      return await provideQuickAnswers(payload);

    case REPORT_GENERATION:
      return await generateReports(payload);

    case PROGRESS_TRACKING:
      return await trackProgress(payload);

    case HEALTH_REMINDERS:
      return await provideHealthReminders(payload);

    default:
      throw { statusCode: 400, message: "Invalid AI Task Type" };
  }
};
