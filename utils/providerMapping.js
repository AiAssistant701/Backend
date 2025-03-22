import {
  sendEmail,
  getUnreadEmails,
  searchEmails,
  summarizeUnreadEmails,
} from "../integrations/gmailService.js";
import {
  createCalendarEvent,
  getUpcomingEvents,
} from "../integrations/googleCalenderService.js";
import {
  uploadFileToGoogleDrive,
  getGoogleDriveFiles,
  organizeFilesInDrive,
} from "../integrations/files/googleDriveService.js";

export const EMAIL_PROVIDERS = {
  Gmail: {
    sendEmail: (payload) =>
      sendEmail(payload.googleId, payload.to, payload.subject, payload.message),
    getUnreadEmails: (payload) => getUnreadEmails(payload.googleId),
    searchEmails: (payload) => searchEmails(payload.googleId, payload.query),
    summarizeEmails: (payload) => summarizeUnreadEmails(payload.googleId),
  },
  // Outlook: {
  //   sendEmail: (payload) => sendOutlookEmail(payload.outlookId, payload.to, payload.subject, payload.message),
  //   getUnreadEmails: (payload) => getOutlookUnreadEmails(payload.outlookId),
  //   searchEmails: (payload) => searchOutlookEmails(payload.outlookId, payload.query),
  //   summarizeEmails: (payload) => summarizeOutlookEmails(payload.outlookId),
  // },
};

export const CALENDAR_PROVIDERS = {
  "Google Calendar": {
    createEvent: (payload) =>
      createCalendarEvent(payload.googleId, payload.eventDetails),
    getUpcomingEvents: (payload) => getUpcomingEvents(payload.googleId),
  },
  // "Microsoft Outlook": {
  //   createEvent: (payload) => createOutlookEvent(payload.outlookId, payload.eventDetails),
  //   getUpcomingEvents: (payload) => getOutlookUpcomingEvents(payload.outlookId),
  // },
};

export const FILE_PROVIDERS = {
  "Google Drive": {
    uploadFile: (payload) =>
      uploadFileToGoogleDrive(
        payload.googleId,
        payload.filePath,
        payload.fileName
      ),
    getFiles: (payload) => getGoogleDriveFiles(payload.googleId, payload.query),
    organizeFiles: (payload) => organizeFilesInDrive(payload.googleId),
  },
//   OneDrive: {
//     uploadFile: (payload) =>
//       uploadFileToOneDrive(
//         payload.oneDriveId,
//         payload.filePath,
//         payload.fileName
//       ),
//     getFiles: (payload) => getOneDriveFiles(payload.oneDriveId, payload.query),
//     organizeFiles: (payload) => organizeFilesInOneDrive(payload.oneDriveId),
//   },
//   Dropbox: {
//     uploadFile: (payload) =>
//       uploadFileToDropbox(
//         payload.dropboxId,
//         payload.filePath,
//         payload.fileName
//       ),
//     getFiles: (payload) => getDropboxFiles(payload.dropboxId, payload.query),
//     organizeFiles: (payload) => organizeFilesInDropbox(payload.dropboxId),
//   },
};
