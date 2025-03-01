import mongoose from "mongoose";

const transcriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    platform: {
      type: String,
      enum: ["whatsapp", "google_meet"],
      required: true,
    },
    transcript: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Transcription = mongoose.model("Transcription", transcriptionSchema);

export default Transcription;
