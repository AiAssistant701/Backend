import mongoose from "mongoose";

const subagentConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subagentType: {
    type: String,
    required: true,
  }, // send_email
  provider: {
    type: String,
    required: true,
  },
  config: {
    type: Object,
    required: true,
  },
});

subagentConfigSchema.index({ userId: 1, subagentType: 1 }, { unique: true });

export default mongoose.model("SubagentConfig", subagentConfigSchema);

// example payload
// {
//     "userId": "user123",
//     "subagentType": "FETCH_UNREAD_EMAILS",
//     "config": {
//       "provider": "Gmail",
//       "settings": {

//       }
//     }
//   }
