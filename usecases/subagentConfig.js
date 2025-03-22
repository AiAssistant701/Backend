import SubagentConfig from "../models/SubagentConfig.js";
import {
  SEND_EMAIL,
  MEETING_SCHEDULING,
  FILE_RETRIEVAL,
} from "../utils/constants.js";

export const getSubagentConfig = async (userId, subagentType) => {
  const config = await SubagentConfig.findOne({ userId, subagentType });

  // Return default config if none exists
  if (!config) {
    return { subagentType, config: getDefaultConfig(subagentType) };
  }
  return config;
};

export const updateSubagentConfig = async (userId, subagentType, newConfig) => {
  const config = await SubagentConfig.findOneAndUpdate(
    { userId, subagentType },
    { $set: { config: newConfig } },
    { new: true, upsert: true }
  );
  return config;
};

// Helper function to return default configurations
const getDefaultConfig = (subagentType) => {
  switch (subagentType) {
    case SEND_EMAIL:
      return { provider: "Gmail", autoReply: false, signature: "" };
    case MEETING_SCHEDULING:
      return {
        provider: "Google Calendar",
        defaultDuration: 30,
        bufferTime: 10,
      };
    case FILE_RETRIEVAL:
      return { provider: "Google Drive", searchFilters: {} };
    default:
      return {};
  }
};
