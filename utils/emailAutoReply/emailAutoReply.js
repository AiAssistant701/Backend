import { shouldAutoReply } from "./classifyEmail.js";
import {
  getUnreadEmails,
  sendAutoReply,
} from "../../integrations/gmailService.js";
import { logAIDecision } from "../../usecases/aiDecicionLogs.js";
import { generateAutoReply } from "./generateAutoReply.js";

// =======================
// Process unread emails & send auto-replies if needed
// =======================
export const processAutoReplies = async (googleId) => {
  const startTime = Date.now(); // Start time for execution tracking
  try {
    const unreadEmails = await getUnreadEmails(googleId);
    const unreadEmailsResponse = unreadEmails.response;

    for (const email of unreadEmailsResponse) {
      const needsReply = await shouldAutoReply(email);
      console.log(
        `Email from ${email.from} needs reply: ${needsReply.shouldReply}`
      );
      if (!needsReply) continue;

      const replyMessage = await generateAutoReply(email);
      console.log(
        `Auto-reply generated for email from ${email.from}: ${replyMessage}`
      );
      await sendAutoReply(googleId, email, replyMessage);

      // Calculate execution time
      const executionTime = Date.now() - startTime;

      // Log AI decision
      await logAIDecision(
        "AUTO_REPLY",
        "Mistral-7B-Instruct",
        0.95,
        `Generated an automated reply for email from ${email.sender}.`,
        executionTime
      );
    }

    return { message: "Auto-reply process completed." };
  } catch (error) {
    throw new Error(`Error processing auto-replies: ${error.message}`);
  }
};
