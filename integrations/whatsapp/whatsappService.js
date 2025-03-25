import axios from "axios";
import dotenv from "dotenv";
import logger from "../../utils/logger.js";
import { getUserByPhoneNumber } from "../../usecases/users.js";
import { processUserRequest } from "../../utils/taskProcessor.js";
import responseHandler from "../../middlewares/responseHandler.js";

dotenv.config();

const WHATSAPP_API_URL = "https://graph.facebook.com/v16.0";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "token";
const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID || "phone_id";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// =======================
// Sends a message to a user via WhatsApp
// =======================
export const sendWhatsAppMessage = async (recipient, message) => {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: recipient,
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    logger.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
    throw new Error("Failed to send WhatsApp message.");
  }
};

// =======================
// Verifies the webhook for WhatsApp API
// =======================
export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    logger.info("Webhook verified successfully.");
    res.status(200).send(challenge);
  } else {
    responseHandler(res, null, "Verification failed.", 403);
  }
};

// =======================
// Handles incoming WhatsApp messages
// =======================
export const receiveWhatsAppMessage = async (req, res, next) => {
  try {
    if (!req.body.object || !req.body.entry) {
      return responseHandler(
        res,
        null,
        "Not a valid WhatsApp webhook payload",
        400
      );
    }

    // Process messages
    for (const entry of req.body.entry) {
      for (const change of entry.changes) {
        if (!change.value.messages || change.value.messages.length === 0) {
          continue; // Skip if no messages
        }

        const message = change.value.messages[0];
        const sender = message.from;
        const text = message.text?.body || "";

        logger.info(`Received WhatsApp message from ${sender}: ${text}`);

        const user = await getUserByPhoneNumber(sender);
        if (!user) {
          await sendWhatsAppMessage(
            sender,
            "You need to connect your WhatsApp number to your account first. Please visit our website to set this up."
          );
          return responseHandler(
            res,
            null,
            "Message received but user not found",
            200
          );
        }

        try {
          const { result } = await processUserRequest({
            userId: user.id,
            prompt: text,
            googleId: user.googleId,
          });

          await sendWhatsAppMessage(sender, result.response);
        } catch (processingError) {
          logger.error("Error processing message:", processingError);
          await sendWhatsAppMessage(
            sender,
            "I'm sorry, I couldn't process your request. Please try again or rephrase your message."
          );
        }
      }
    }

    return responseHandler(
      res,
      null,
      "WhatsApp message processed successfully",
      200
    );
  } catch (error) {
    logger.error("Error in WhatsApp webhook handler:", error);
    return responseHandler(res, null, "Webhook received", 200);
  }
};
