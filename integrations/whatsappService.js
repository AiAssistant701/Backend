import axios from "axios";
import dotenv from "dotenv";
import { getModelForTask } from "../utils/modelRouter.js";
import { getUserByPhoneNumber } from "../usecases/users.js";
import { classifyIntent } from "../utils/intentClassifier.js";
import responseHandler from "../middlewares/responseHandler.js";
import { aiOrchestrator } from "../services/aiOrchestratorService.js";
import {
  createTaskHistory,
  updateTaskToCompleted,
} from "../usecases/taskHistory.js";
import {
  generateTaskDescription,
  enrichPayloadForTaskType,
} from "../utils/helpers.js";

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
    console.error(
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
    console.log("Webhook verified successfully.");
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
    // Validate webhook structure
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

        // Log incoming message
        console.log(`Received WhatsApp message from ${sender}: ${text}`);

        // Get user or send appropriate error
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

        // Process the message
        try {
          const taskType = await classifyIntent(text);
          const description = await generateTaskDescription(text);

          const taskHistory = await createTaskHistory(
            user.id,
            taskType,
            description,
            text
          );

          // Create base payload
          const provider = getModelForTask(taskType);
          let payload = {
            userId: user.id,
            provider,
            query: text,
            taskHistoryId: taskHistory.id,
          };

          payload = await enrichPayloadForTaskType(taskType, text, payload);

          const aiResponse = await aiOrchestrator(taskType, payload);

          await updateTaskToCompleted(taskHistory._id);
          await sendWhatsAppMessage(sender, aiResponse.response);
        } catch (processingError) {
          console.error("Error processing message:", processingError);
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
    console.error("Error in WhatsApp webhook handler:", error);
    return responseHandler(res, null, "Webhook received", 200);
  }
};
