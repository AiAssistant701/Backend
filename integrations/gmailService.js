import { google } from "googleapis";
import { getUserTokens } from "../usecases/users.js";

// to send email
export const sendEmail = async (googleId, to, subject, message) => {
  const tokens = await getUserTokens(googleId);
  if (!tokens) throw new Error("No Gmail authentication found for user.");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const emailContent = `
      To: ${to}
      Subject: ${subject}
  
      ${message}
    `;

  const encodedMessage = Buffer.from(emailContent)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });

  return response.data;
};
