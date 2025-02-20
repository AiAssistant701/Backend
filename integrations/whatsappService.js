import axios from "axios";
import responseHandler from "../middlewares/responseHandler.js";
import { userIntent } from "../services/userIntentService.js";
import { aiOrchestrator } from "../services/aiOrchestratorService.js";

const WHATSAPP_API_URL = "https://graph.facebook.com/v16.0";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "token";
const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID || "phone_id";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Sends a message to a user via WhatsApp
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
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
    throw new Error("Failed to send WhatsApp message.");
  }
};

// Verifies the webhook for WhatsApp API
export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully.");
    res.status(200).send(challenge);
  } else {
    responseHandler(res, null, "Verification failed.", 403);
  }
};

// Handles incoming WhatsApp messages
export const receiveWhatsAppMessage = async (req, res, next) => {
  try {
    const body = req.body;

    if (body.object && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            const message = change.value.messages[0];
            const sender = message.from;
            const text = message.text?.body || "";

            console.log(`Received WhatsApp message from ${sender}: ${text}`);
            
            const taskType = await userIntent(text); // user intent

            const aiResponse = await aiOrchestrator(taskType, text);

            // Send response to user
            await sendWhatsAppMessage(sender, aiResponse.response);
          }
        }
      }
    }

    responseHandler(res, null, "WhatsApp message processed successfully");
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    next(error);
  }
};
