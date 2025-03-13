import axios from "axios";
import dotenv from "dotenv";
import {
  SEND_EMAIL,
  MEETING_SCHEDULING,
  QUICK_ANSWERS,
  UPLOAD_FILE,
  FILE_RETRIEVAL,
  REPORT_GENERATION,
  MARKET_RESEARCH,
  FINANCE_ANALYSIS,
} from "./constants.js";
import { extractEventDetails } from "./extractEventDetails.js";

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
// to modularize payload
// =======================
export const enrichPayloadForTaskType = async (taskType, text, basePayload) => {
  switch (taskType) {
    case SEND_EMAIL:
      const emailDetails = extractEmailDetails(text);
      if (!emailDetails) {
        throw new Error("Could not extract email details");
      }
      return { ...basePayload, ...emailDetails };

    case MEETING_SCHEDULING:
      const eventDetails = await extractEventDetails(text);
      if (!eventDetails) {
        throw new Error("Could not extract event details");
      }
      return { ...basePayload, eventDetails };

    case QUICK_ANSWERS:
    case FILE_RETRIEVAL:
    case MARKET_RESEARCH:
      return basePayload;

    case REPORT_GENERATION:
      return {
        ...basePayload,
        query: `Generate a report for ${text}`,
      };

    // File-based tasks should be handled differently for WhatsApp
    case UPLOAD_FILE:
    case FINANCE_ANALYSIS:
      throw new Error("File uploads not supported via WhatsApp messages");

    default:
      return basePayload;
  }
};
