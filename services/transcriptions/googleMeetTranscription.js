import fs from "fs";
import speech from "@google-cloud/speech";
import logger from "../../utils/logger.js";
import { saveTranscription } from "../../usecases/transcriptions.js";

const client = new speech.SpeechClient();

// =======================
// Transcribes a Google Meet recording
// =======================
export const transcribeGoogleMeet = async (audioFilePath, userId) => {
  try {
    const audioBytes = fs.readFileSync(audioFilePath).toString("base64");

    const request = {
      audio: { content: audioBytes },
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 16000,
        languageCode: "en-US",
      },
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");

    // Save transcription in MongoDB
    await saveTranscription(userId, transcription, "google_meet");

    return transcription;
  } catch (error) {
    logger.error("❌ Google Meet Transcription Error:", error.message);
    throw new Error("Failed to transcribe Google Meet audio.");
  }
};
