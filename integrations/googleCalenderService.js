import { google } from "googleapis";
import { getUserTokens } from "../usecases/users.js";

// =======================
// Create a new event in Google Calendar
// =======================
export const createCalendarEvent = async (googleId, eventDetails) => {
  const tokens = await getUserTokens(googleId);
  if (!tokens) throw new Error("No Google authentication found for user.");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description || "",
    start: { dateTime: eventDetails.startTime, timeZone: "UTC" },
    end: { dateTime: eventDetails.endTime, timeZone: "UTC" },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  return response.data;
};

// =======================
// Fetch upcoming calendar events
// =======================
export const getUpcomingEvents = async (googleId) => {
  const tokens = await getUserTokens(googleId);
  if (!tokens) throw new Error("No Google authentication found for user.");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items;
};
