import dotenv from "dotenv";
import logger from "../logger.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pipeline } from "@xenova/transformers";

dotenv.config();

let localModel = null;

// =======================
// Gets or initializes the local text generation model
// =======================
const getLocalModel = async () => {
  if (!localModel) {
    localModel = await pipeline("text-generation", "Xenova/gpt2");
  }
  return localModel;
};

// =======================
// Generates an automatic reply based on the email content using Gemini AI.
// =======================
export const generateAutoReply = async (email) => {
  try {
    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
      Given this email:
      Subject: ${email.subject}
      Content: ${email.snippet}
      
      Generate a professional, empathetic, and helpful auto-reply that:
      1. Acknowledges receipt of the email.
      2. If the email snippet contains a direct question, provide a brief answer.
      3. Provides an estimated response timeframe, such as 2 hours, or 1 business day, depending on the complexity of the issue.
      4. Is concise and clear, replying in a single paragraph.
      5. Do NOT use placeholders like [Your Name].
      6. Do NOT include the original email content or subject in the auto-reply.
      
      Reply:`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const reply = text.trim();
      if (reply) return reply;
    }

    // Fallback to local model if Gemini AI fails or isn't configured
    logger.info("Falling back to local model...");
    const generator = await getLocalModel();
    const result = await generator(prompt, {
      max_length: 200,
      temperature: 0.7,
      top_k: 50,
      top_p: 0.9,
    });

    let generatedText = result[0].generated_text.replace(prompt, "").trim();

    if (generatedText) return formatResponse(generatedText, email);

    // Final fallback if both methods fail
    return getFallbackResponse(email);
  } catch (error) {
    logger.error("Error generating auto-reply: " + error);
    return getFallbackResponse(email);
  }
};

// =======================
// Formats the response with proper structure
// =======================
const formatResponse = (text, email) => {
  return `Thank you for your email regarding "${email.subject}".

    ${text}

    Best regards,
    [Auto-Reply System]`;
};

// =======================
// Returns a fallback response when generation fails
// =======================
const getFallbackResponse = (email) => {
  return `Thank you for your email regarding "${email.subject}".

    This is an automated response confirming that we've received your message. A team member will review and respond to your inquiry within 1-2 business days.

    Best regards,
    [Auto-Reply System]`;
};

// test
// const testEmail = {
//   subject: "New email",
//   snippet: "How do I add a number on whatsapp.",
// };

// generateAutoReply(testEmail)
//   .then((reply) => logger.info(reply))
//   .catch((error) => logger.error(error));
