import Transcription from "../models/Transcription.js";

export const saveTranscription = async (userId, transcript, platform) => {
  await Transcription.create({ userId, platform, transcript });
};
