import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// =======================
// to extract email details
// =======================
export const extractEmailDetails = (text) => {
  const toMatch = text.match(/to ([\w.-]+@[\w.-]+\.\w+)/);
  const subjectMatch =
    text.match(/subject (.+?) message/i) || "Unknown Subject";
  const messageMatch =
    text.match(/message (.+)$/i) || text.match(/about (.+)$/i);

  if (toMatch && subjectMatch && messageMatch) {
    return {
      to: toMatch[1],
      subject: subjectMatch[1],
      message: messageMatch[1],
    };
  }
  return null;
};

// =======================
// to extract email
// =======================
export const extractEmail = (sender) => {
  const match = sender.match(/<(.*?)>/);
  return match ? match[1] : sender;
};

// =======================
// to generate tasks descriptions
// =======================
export const generateTaskDescription = async (prompt) => {
  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const geminiApiPayload = {
    contents: [
      {
        parts: [
          {
            text: `Generate a  brief and concise description for this user's prompt. Use this format 'Asked about this question', 'Sent email to to johndoe@yahoo.com': ${prompt}`,
          },
        ],
      },
    ],
  };
  const headers = { "Content-Type": "application/json" };
  const response = await axios.post(geminiApiUrl, geminiApiPayload, {
    headers,
  });

  const description = response.data.candidates?.[0]?.content.parts[0].text;

  return description;
};

// =======================
// to extract time for health reminders
// =======================
export const extractTime = (message) => {
  const timePattern = /\b(\d{1,2}(:\d{2})?\s?(AM|PM)?)\b/i;
  const match = message.match(timePattern);
  return match ? match[0] : null;
};

// =======================
// to extract reminder text for health reminders
// =======================
export const extractReminderText = (message) => {
  return message
    .replace(
      /remind me to|set a reminder for|at \d{1,2}(:\d{2})?\s?(AM|PM)?/gi,
      ""
    )
    .trim();
};
