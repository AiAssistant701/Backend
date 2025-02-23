import { processResearchPaper } from "./researchService.js";
import { processMessage } from "./messagingService.js";
import { organizeFiles } from "./fileService.js";
import { analyzeBankStatement } from "./financeService.js";
import { manageEmailInbox, scheduleMeetings } from "./messagingService.js";
import { retrieveFiles } from "./fileService.js";
import { performResearch, provideQuickAnswers } from "./researchService.js";
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
import { uploadFileToGoogleDrive } from "../integrations/files/googleDriveService.js";
import {
  generateReports,
  trackProgress,
  provideHealthReminders,
} from "./productivityService.js";
import {
  RESEARCH_ANALYSIS,
  MESSAGE_PROCESSING,
  UPLOAD_FILE,
  FINANCE_ANALYSIS,
  SEND_EMAIL,
  FETCH_UNREAD_EMAILS,
  SEARCH_EMAILS,
  SUMMARIZE_EMAILS,
  MEETING_SCHEDULING,
  FETCH_UPCOMING_EVENTS,
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

    case FINANCE_ANALYSIS:
      return await analyzeBankStatement(payload);

    case UPLOAD_FILE:
      return await uploadFileToGoogleDrive(payload.googleId, payload.filePath, payload.fileName);

    case SEND_EMAIL: //
      return await sendEmail(
        payload.googleId,
        payload.to,
        payload.subject,
        payload.message
      );

    case FETCH_UNREAD_EMAILS: //
      return await getUnreadEmails(payload.googleId);

    case SEARCH_EMAILS: //
      return await searchEmails(payload.googleId, payload.query);

    case SUMMARIZE_EMAILS: //
      return await summarizeUnreadEmails(payload.googleId);

    case MEETING_SCHEDULING: //
      return await createCalendarEvent(payload.googleId, payload.eventDetails);

    case FETCH_UPCOMING_EVENTS: //
      return await getUpcomingEvents(payload.googleId);

    case FILE_RETRIEVAL:
      return await retrieveFiles(payload);

    case MARKET_RESEARCH:
      return await performResearch(payload);

    case QUICK_ANSWERS: // ~~~~~~~~~~~~~~~~~~~
      return await provideQuickAnswers(payload.query);

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
