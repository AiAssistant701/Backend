import cron from "node-cron";
import User from "../../models/User.js";
import Transaction from "../../models/Transaction.js";
import { sendEmail } from "../../integrations/gmailService.js";
import { calculateInsights, detectAnomalies } from "../finance.js";
import { getTransactionsByUserId } from "../../usecases/transactions.js";

cron.schedule("0 8 1 * *", async () => {
  const users = await User.find();

  for (const user of users) {
    const transactions = await getTransactionsByUserId(user.id);
    const insights = calculateInsights(transactions);
    const anomalies = detectAnomalies(transactions);

    sendEmail(
      user.googleId,
      user.email,
      "Monthly Financial Report",
      JSON.stringify({ insights, anomalies }, null, 2)
    );
  }
});
