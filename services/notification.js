import { sendEmail } from "../integrations/google/gmailService.js";

export const sendReminder = (googleId, email, subject, message) => {
  try {
    sendEmail(googleId, email, subject, message);
    // sendWhatsAppMessage(phone, message);
  } catch (error) {
    throw error;
  }
};
