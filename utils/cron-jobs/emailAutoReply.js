import cron from "node-cron";
import logger from "../logger.js";
import { getUsersWithEmailAutoReplyOn } from "../../usecases/users.js";
import { processAutoReplies } from "../emailAutoReply/emailAutoReply.js";

// =======================
// Runs auto-reply processing every 15 minutes
// =======================
cron.schedule("*/15 * * * *", async () => {
  logger.info("🔄 Running Auto-Reply Cron Job...");

  try {
    const users = await getUsersWithEmailAutoReplyOn();
    if (!users.length) {
      logger.info("⚠️ No users with Google accounts found.");
      return;
    }

    for (const user of users) {
      logger.info(`✉️ Processing auto-replies for user: ${user.email}`);
      await processAutoReplies(user.googleId);
    }

    logger.info("✅ Auto-Reply Process Completed.");
  } catch (error) {
    logger.error("❌ Auto-Reply Cron Job Error:", error.message);
  }
});
