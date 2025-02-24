import { google } from "googleapis";
import { getUserTokens } from "../usecases/users.js";

// =======================
// to send email
// =======================
export const sendEmail = async (googleId, to, subject, message) => {
  try {
    const tokens = await getUserTokens(googleId);
    console.log("tokens", tokens);
    if (!tokens) throw new Error("No Gmail authentication found for user.");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
    }); // remember to fix refresh_token issue (tokens)

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

    return response.data;
  } catch (error) {
    console.error(error?.errors[0].message);
    throw new Error("Failed to send email");
  }
};

// =======================
// get unread emails
// =======================
export const getUnreadEmails = async (googleId) => {
  const tokens = await getUserTokens(googleId);
  if (!tokens) throw new Error("No Gmail authentication found for user.");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: tokens.accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const response = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults: 10,
  });

  const messages = response.data.messages || [];
  return await fetchEmailDetails(gmail, messages);
};

// =======================
// Search for emails matching the query
// =======================
export const searchEmails = async (googleId, query) => {
  const tokens = await getUserTokens(googleId);
  if (!tokens) throw new Error("No Gmail authentication found for user.");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const response = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 10,
  });

  const messages = response.data.messages || [];
  return await fetchEmailDetails(gmail, messages);
};

// =======================
// fetch email details
// =======================
const fetchEmailDetails = async (gmail, messages) => {
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
    t;

    emailDetails.push({ from, subject, snippet });
  }

  return emailDetails;
};

// =======================
// Summarize each email
// =======================
export const summarizeUnreadEmails = async (googleId) => {
  const tokens = await getUserTokens(googleId);
  if (!tokens) throw new Error("No Gmail authentication found for user.");

  const emails = await getUnreadEmails(googleId);

  const summarizedEmails = await Promise.all(
    emails.map(async (email) => {
      const response = await axios.post(
        `${process.env.PYTHON_AI_URL}/summarize/`,
        {
          text: email.snippet,
        }
      );

      return {
        from: email.from,
        subject: email.subject,
        summary: response.data.summary,
      };
    })
  );

  return summarizedEmails;
};
