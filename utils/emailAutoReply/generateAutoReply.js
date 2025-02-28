import { GoogleGenerativeAI } from "@google/generative-ai";
import { pipeline } from "@xenova/transformers";
import dotenv from "dotenv";

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
  const prompt = `
    Given this email:
    Subject: ${email.subject}
    Content: ${email.snippet}

    Generate a professional and friendly auto-reply that:
    1. Acknowledges receipt of the email
    2. Provides an estimated response timeframe
    3. Is concise and clear
    4. Do NOT use placeholders like [Your Name]. And if a time is required to be mentioned, use 2 hours
    5. Do NOT include the original email content in the auto-reply
    6. Do NOT include the original email subject in the auto-reply
    7. Provide a response using the email snippet as a reference

    Reply:`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const reply = text.trim();
      if (reply) return reply;
    }

    // Fallback to local model if Gemini AI fails or isn't configured
    console.log("Falling back to local model...");
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
    console.error("Error generating auto-reply:", error);
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

const testEmail = {
  subject: "Inquiry",
  snippet: "Your site has crashed.",
};

generateAutoReply(testEmail)
  .then((reply) => console.log(reply))
  .catch((error) => console.error(error));
