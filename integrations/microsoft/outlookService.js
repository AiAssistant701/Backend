import axios from "axios";

export const sendOutlookEmail = async (accessToken, to, subject, message) => {
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
};

export const getOutlookUnreadEmails = async ({ microsoftToken }) => {
  const response = await axios.get(
    "https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$filter=isRead eq false",
    { headers: { Authorization: `Bearer ${microsoftToken}` } }
  );
  return response.data.value;
};
