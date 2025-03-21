import cron from "node-cron";
import { getAllUsersWithGoogleId } from "../../usecases/users.js";
import { processAutoReplies } from "../emailAutoReply/emailAutoReply.js";

// =======================
// Runs auto-reply processing every 15 minutes
// =======================
cron.schedule("*/15 * * * *", async () => {
  console.log("🔄 Running Auto-Reply Cron Job...");

  try {
    const users = await getAllUsersWithGoogleId();
    if (!users.length) {
      console.log("⚠️ No users with Google accounts found.");
      return;
    }

    for (const user of users) {
      console.log(`✉️ Processing auto-replies for user: ${user.email}`);
      await processAutoReplies(user.googleId);
    }

    console.log("✅ Auto-Reply Process Completed.");
  } catch (error) {
    console.error("❌ Auto-Reply Cron Job Error:", error.message);
  }
});
