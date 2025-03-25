import cron from "node-cron";
import BankStatement from "../../models/BankStatement.js";

// =======================
// Run every 1st of the month at 9 AM
// =======================
cron.schedule("0 9 1 * *", async () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const usersWithoutRecentStatements = await User.find({
    _id: {
      $nin: await BankStatement.find({
        uploadDate: { $gte: oneMonthAgo },
      }).distinct("userId"),
    },
  });

  usersWithoutRecentStatements.forEach((user) => {
    sendReminder(
      user.googleAuth.googleId,
      user.email,
      "Upload Bank Statement Reminder",
      "It's time to upload your bank statement!"
    );
  });
});
