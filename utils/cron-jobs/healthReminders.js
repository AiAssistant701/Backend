import moment from "moment";
import cron from "node-cron";
import { getUserById } from "../../usecases/users.js";
import HealthReminder from "../../models/HealthReminders.js";
import { extractTime, extractReminderText } from "../helpers.js";
import { sendWhatsAppMessage } from "../../integrations/whatsappService.js";

export const handleHealthReminder = async (userMessage, userId) => {
  try {
    const user = await getUserById(userId);
    const reminderTime = extractTime(userMessage);
    const reminderText = extractReminderText(userMessage);

    if (!user.phoneNumber)
      throw new Error("Phone Number is required for user!");

    if (!reminderTime)
      throw new Error("Please specify a time for your reminder.");

    const reminderDate = moment(reminderTime, ["h:mm A"]).toDate();

    await HealthReminder.create({
      userId,
      text: reminderText,
      time: reminderDate,
      phoneNumber: user.phoneNumber,
    });

    const cronTime = `${moment(reminderDate).minutes()} ${moment(
      reminderDate
    ).hours()} * * *`;

    cron.schedule(cronTime, async () => {
      await sendWhatsAppMessage(
        user.phoneNumber,
        `⏰ Reminder: ${reminderText}`
      );
    });

    return {
      response: `Got it! I'll remind you to '${reminderText}' at ${moment(
        reminderDate
      ).format("h:mm A")}.`,
    };
  } catch (error) {
    throw error;
  }
};
