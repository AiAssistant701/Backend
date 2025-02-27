import { classifyText } from "../services/classifyEmailService.js";
import { getUnreadEmails, sendAutoReply } from "../integrations/gmailService.js";
import { provideQuickAnswers } from "../services/researchService.js";
import { logAIDecision } from "../usecases/aiDecicionLogs.js";

// =======================
// Check if email should receive an auto-reply
// =======================
export const shouldAutoReply = async (email) => {
  const classification = await classifyText(email.snippet);

  const autoReplyKeywords = [
    "out of office",
    "support",
    "inquiry",
    "urgent",
    "thank you",
  ];
  return autoReplyKeywords.some((keyword) => classification.includes(keyword));
};

// =======================
// Process unread emails & send auto-replies if needed
// =======================
export const processAutoReplies = async (googleId) => {
  const unreadEmails = await getUnreadEmails(googleId);

  for (const email of unreadEmails) {
    const needsReply = await shouldAutoReply(email);
    if (!needsReply) continue;

    const replyMessage = await generateAutoReply(email);
    await sendAutoReply(googleId, email, replyMessage);

    // Log AI decision
    await logAIDecision(
      "AUTO_REPLY",
      "Mistral-7B-Instruct",
      0.95,
      `Generated an automated reply for email from ${email.sender}.`
    );
  }

  return { message: "Auto-reply process completed." };
};
