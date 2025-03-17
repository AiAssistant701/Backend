import mongoose from "mongoose";

const healthReminderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    text: {
      type: String,
    },
    time: {
      type: String,
    },
    phoneNumber: {
      type: Array,
    },
  },
  { timestamps: true }
);

const HealthReminder = mongoose.model("HealthReminder", healthReminderSchema);

export default HealthReminder;
