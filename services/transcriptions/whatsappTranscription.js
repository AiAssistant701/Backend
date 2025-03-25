import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import logger from "../../utils/logger.js";
import { logAIDecision } from "../../usecases/aiDecicionLogs.js";
import { saveTranscription } from "../../usecases/transcriptions.js";

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

// =======================
// Transcribes a WhatsApp voice message using AssemblyAI
// =======================
export const transcribeWhatsAppAudio = async (audioUrl, userId) => {
  try {
    const response = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      { audio_url: audioUrl },
      { headers: { authorization: ASSEMBLYAI_API_KEY } }
    );

    const transcriptId = response.data.id;
    let transcription;

    // Poll API until transcription is ready
    while (true) {
      const transcript = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        { headers: { authorization: ASSEMBLYAI_API_KEY } }
      );

      if (transcript.data.status === "completed") {
        transcription = transcript.data.text;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }

    // Save transcription in MongoDB
    await saveTranscription(userId, transcription, "whatsapp");

    // Log AI decision
    await logAIDecision(
      "WHATSAPP_TRANSCRIPTION",
      "AssemblyAI",
      0.95,
      "Converted WhatsApp voice message to text"
    );

    return transcription;
  } catch (error) {
    logger.error("❌ WhatsApp Transcription Error:", error.message);
    throw new Error("Failed to transcribe WhatsApp audio.");
  }
};
