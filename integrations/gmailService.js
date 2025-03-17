import { google } from "googleapis";
import { OPENAI, SEND_EMAIL, GEMINI } from "../utils/constants.js";
import { extractEmail } from "../utils/helpers.js";
import { getUserByGoogleID } from "../usecases/users.js";
import { chatbotService } from "../services/chatbotService.js";

// =======================
// to send email
// =======================
export const sendEmail = async (googleId, to, subject, message) => {
  try {
    const user = await getUserByGoogleID(googleId);
    if (!user || !user.tokens) throw new Error("No Gmail authentication found for user.");

    if (message.toLowerCase().startsWith("about")) {
      let template = 
      `Generate a professional email ${message}. Do NOT use placeholders like [Your Name] or [Recipient Name]. If a value is unknown, omit it instead. 
      Use ${user.name} as the sender's name and break the email ${to} into reasonable first name or last name or both and use the most reasonable one as the recipient name. 
      Do NOT include any additional information not included in the message. 
      Do NOT include a subject`;

      let payload = {
        userId: user.id,
        query: template,
        provider: GEMINI,
      };
      let response = await chatbotService(SEND_EMAIL, payload);
      message = response.response;
    }
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(user.tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const emailContent = [
      `To: ${to}`,
      `From: me`,
      `Subject: ${subject}`,
      "",
      message,
    ].join("\n");

    const encodedMessage = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    return {
      result: response.data,
      response: "Email SENT!",
      message: SEND_EMAIL,
    };
  } catch (error) {
    throw new Error(`Gmail API Error: ${error.message}`);
  }
};

// =======================
// get unread emails
// =======================
export const getUnreadEmails = async (googleId) => {
  try {
    const user = await getUserByGoogleID(googleId);
    if (!user || !user.tokens) throw new Error("No Gmail authentication found for user.");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(user.tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      maxResults: 10,
    });

    const messages = response.data.messages || [];
    return await fetchEmailDetails(gmail, messages);
  } catch (error) {
    throw new Error(`Gmail API Error: ${error.message}`);
  }
};

// =======================
// Search for emails matching the query
// =======================
export const searchEmails = async (googleId, query) => {
  try {
    const user = await getUserByGoogleID(googleId);
    if (!user || !user.tokens) throw new Error("No Gmail authentication found for user.");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(user.tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const response = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 10,
    });

    const messages = response.data.messages || [];
    return await fetchEmailDetails(gmail, messages);
  } catch (error) {
    throw new Error(`Gmail API Error: ${error.message}`);
  }
};

// =======================
// fetch email details
// =======================
const fetchEmailDetails = async (gmail, messages) => {
  try {
    const emailDetails = [];

    for (const msg of messages) {
      const email = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const headers = email.data.payload.headers;
      const subject =
        headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from =
        headers.find((h) => h.name === "From")?.value || "Unknown Sender";
      const snippet = email.data.snippet;

      emailDetails.push({ from, subject, snippet });
    }

    return { response: emailDetails };
  } catch (error) {
    throw new Error(`Gmail API Error: ${error.message}`);
  }
};

// =======================
// Summarize each email
// =======================
export const summarizeUnreadEmails = async (googleId) => {
  try {
    const user = await getUserByGoogleID(googleId);
    if (!user || !user.tokens) throw new Error("No Gmail authentication found for user.");

    const emails = await getUnreadEmails(googleId);

    const summarizedEmails = await Promise.all(
      emails.map(async (email) => {
        let payload = {
          userId: user.id,
          query: `Generate a summary for this email: ${email.snippet}`,
          provider: OPENAI,
        };

        let response = await chatbotService(SEND_EMAIL, payload);

        return {
          from: email.from,
          subject: email.subject,
          summary: response.response,
        };
      })
    );

    return { response: summarizedEmails };
  } catch (error) {
    throw new Error(`Gmail API Error: ${error.message}`);
  }
};

// =======================
// Sends an auto-reply via Gmail API
// =======================
export const sendAutoReply = async (googleId, email, message) => {
  try {
    const user = await getUserByGoogleID(googleId);
    if (!user || !user.tokens) throw new Error("No Google authentication found for user.");

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(user.tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    let sendTo = extractEmail(email.from);

    const emailBody = [
      `To: ${sendTo}`,
      "Subject: Re: " + email.subject,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      message,
    ].join("\n");

    const encodedMessage = Buffer.from(emailBody).toString("base64");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return { response: "Auto-reply sent", to: email.sender };
  } catch (error) {
    throw new Error(`Gmail API Error: ${error.message}`);
  }
};
