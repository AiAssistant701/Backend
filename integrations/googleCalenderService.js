import { google } from "googleapis";
import { getUserByGoogleID } from "../usecases/users.js";
import { MEETING_SCHEDULING } from "../utils/constants.js";

// =======================
// Create a new event in Google Calendar
// =======================
export const createCalendarEvent = async (googleId, eventDetails) => {
  try {
    const user = await getUserByGoogleID(googleId);
    if (!user || !user.tokens)
      throw new Error("No Google authentication found for user.");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(user.tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description || "",
      start: {
        dateTime: new Date(eventDetails.startTime).toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(eventDetails.endTime).toISOString(),
        timeZone: "UTC",
      },
      conferenceData: {
        createRequest: {
          requestId: new Date().toISOString(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: 1,
    });

    return {
      result: response.data,
      response: "Event SET!",
      message: MEETING_SCHEDULING,
    };
  } catch (error) {
    throw new Error(`Google Calendar API Error: ${error}`);
  }
};

// =======================
// Fetch upcoming calendar events
// =======================
export const getUpcomingEvents = async (googleId, eventDetails = {}) => {
  try {
    const user = await getUserByGoogleID(googleId);
    if (!user || !user.tokens)
      throw new Error("No Google authentication found for user.");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(user.tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const { startTime, maxResults = 10 } = eventDetails;

    if (!startTime) throw new Error("Missing startTime in event details.");

    const date = new Date(startTime);

    const timeMin = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0
      )
    ).toISOString();

    const timeMax = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59
      )
    ).toISOString();

    const params = {
      calendarId: "primary",
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    };

    const response = await calendar.events.list(params);

    return { response: response.data.items };
  } catch (error) {
    throw new Error(`Google Calendar API Error: ${error.message}`);
  }
};
