import axios from "axios";
import logger from "../../utils/logger.js";

export const sendOutlookEmail = async (accessToken, to, subject, message) => {
  try {
    const response = await axios.post(
      "https://graph.microsoft.com/v1.0/me/sendMail",
      {
        message: {
          subject,
          body: {
            contentType: "Text",
            content: message,
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    logger.error("Error sending email: " + error.message);
    throw new Error("Failed to send email. Please try again later.");
  }
};

export const getOutlookUnreadEmails = async ({ microsoftToken }) => {
  try {
    const response = await axios.get(
      "https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$filter=isRead eq false",
      { headers: { Authorization: `Bearer ${microsoftToken}` } }
    );
    return response.data.value;
  } catch (error) {
    logger.error("Error fetching unread emails: " + error.message);
    throw new Error("Failed to fetch unread emails. Please try again later.");
  }
};
