import {
  OPENAI,
  COHERE,
  HUGGINGFACE,
  ANTHROPIC,
  MISTRAL,
  GEMINI,
  GROK,
  RESEARCH_ANALYSIS,
  MESSAGE_PROCESSING,
  UPLOAD_FILE,
  FILE_RETRIEVAL,
  ORGANIZE_FILES,
  FINANCE_ANALYSIS,
  SEND_EMAIL,
  FETCH_UNREAD_EMAILS,
  SUMMARIZE_EMAILS,
  SEARCH_EMAILS,
  MEETING_SCHEDULING,
  FETCH_UPCOMING_EVENTS,
  MARKET_RESEARCH,
  QUICK_ANSWERS,
  REPORT_GENERATION,
  PROGRESS_TRACKING,
  HEALTH_REMINDERS,
} from "./constants.js";
import { getUserById } from "../usecases/users.js";

// model capabilities and preferences for different tasks - Higher score indicates better suitability (0-10 scale)
const MODEL_CAPABILITIES = {
  [OPENAI]: {
    [RESEARCH_ANALYSIS]: 7,
    [MESSAGE_PROCESSING]: 9,
    [UPLOAD_FILE]: 5,
    [FILE_RETRIEVAL]: 6,
    [ORGANIZE_FILES]: 7,
    [FINANCE_ANALYSIS]: 6,
    [SEND_EMAIL]: 6,
    [FETCH_UNREAD_EMAILS]: 5,
    [SUMMARIZE_EMAILS]: 8,
    [SEARCH_EMAILS]: 9,
    [MEETING_SCHEDULING]: 9,
    [FETCH_UPCOMING_EVENTS]: 7,
    [MARKET_RESEARCH]: 6,
    [QUICK_ANSWERS]: 8,
    [REPORT_GENERATION]: 7,
    [PROGRESS_TRACKING]: 7,
    [HEALTH_REMINDERS]: 6,
  },
  [ANTHROPIC]: {
    [RESEARCH_ANALYSIS]: 8,
    [MESSAGE_PROCESSING]: 8,
    [UPLOAD_FILE]: 6,
    [FILE_RETRIEVAL]: 6,
    [ORGANIZE_FILES]: 7,
    [FINANCE_ANALYSIS]: 7,
    [SEND_EMAIL]: 9,
    [FETCH_UNREAD_EMAILS]: 9,
    [SUMMARIZE_EMAILS]: 8,
    [SEARCH_EMAILS]: 7,
    [MEETING_SCHEDULING]: 7,
    [FETCH_UPCOMING_EVENTS]: 6,
    [MARKET_RESEARCH]: 7,
    [QUICK_ANSWERS]: 7,
    [REPORT_GENERATION]: 8,
    [PROGRESS_TRACKING]: 6,
    [HEALTH_REMINDERS]: 9,
  },
  [COHERE]: {
    [RESEARCH_ANALYSIS]: 7,
    [MESSAGE_PROCESSING]: 7,
    [UPLOAD_FILE]: 4,
    [FILE_RETRIEVAL]: 5,
    [ORGANIZE_FILES]: 6,
    [FINANCE_ANALYSIS]: 6,
    [SEND_EMAIL]: 5,
    [FETCH_UNREAD_EMAILS]: 4,
    [SUMMARIZE_EMAILS]: 7,
    [SEARCH_EMAILS]: 6,
    [MEETING_SCHEDULING]: 5,
    [FETCH_UPCOMING_EVENTS]: 5,
    [MARKET_RESEARCH]: 7,
    [QUICK_ANSWERS]: 7,
    [REPORT_GENERATION]: 9,
    [PROGRESS_TRACKING]: 6,
    [HEALTH_REMINDERS]: 5,
  },
  [HUGGINGFACE]: {
    [RESEARCH_ANALYSIS]: 9,
    [MESSAGE_PROCESSING]: 6,
    [UPLOAD_FILE]: 5,
    [FILE_RETRIEVAL]: 6,
    [ORGANIZE_FILES]: 6,
    [FINANCE_ANALYSIS]: 9,
    [SEND_EMAIL]: 4,
    [FETCH_UNREAD_EMAILS]: 3,
    [SUMMARIZE_EMAILS]: 6,
    [SEARCH_EMAILS]: 5,
    [MEETING_SCHEDULING]: 4,
    [FETCH_UPCOMING_EVENTS]: 4,
    [MARKET_RESEARCH]: 9,
    [QUICK_ANSWERS]: 6,
    [REPORT_GENERATION]: 7,
    [PROGRESS_TRACKING]: 5,
    [HEALTH_REMINDERS]: 4,
  },
  [MISTRAL]: {
    [RESEARCH_ANALYSIS]: 8,
    [MESSAGE_PROCESSING]: 7,
    [UPLOAD_FILE]: 6,
    [FILE_RETRIEVAL]: 7,
    [ORGANIZE_FILES]: 9,
    [FINANCE_ANALYSIS]: 7,
    [SEND_EMAIL]: 6,
    [FETCH_UNREAD_EMAILS]: 5,
    [SUMMARIZE_EMAILS]: 7,
    [SEARCH_EMAILS]: 6,
    [MEETING_SCHEDULING]: 6,
    [FETCH_UPCOMING_EVENTS]: 9,
    [MARKET_RESEARCH]: 7,
    [QUICK_ANSWERS]: 7,
    [REPORT_GENERATION]: 6,
    [PROGRESS_TRACKING]: 7,
    [HEALTH_REMINDERS]: 6,
  },
  [GEMINI]: {
    [RESEARCH_ANALYSIS]: 8,
    [MESSAGE_PROCESSING]: 8,
    [UPLOAD_FILE]: 6,
    [FILE_RETRIEVAL]: 6,
    [ORGANIZE_FILES]: 7,
    [FINANCE_ANALYSIS]: 7,
    [SEND_EMAIL]: 7,
    [FETCH_UNREAD_EMAILS]: 6,
    [SUMMARIZE_EMAILS]: 9,
    [SEARCH_EMAILS]: 7,
    [MEETING_SCHEDULING]: 7,
    [FETCH_UPCOMING_EVENTS]: 7,
    [MARKET_RESEARCH]: 8,
    [QUICK_ANSWERS]: 9,
    [REPORT_GENERATION]: 8,
    [PROGRESS_TRACKING]: 9,
    [HEALTH_REMINDERS]: 7,
  },
  [GROK]: {
    [RESEARCH_ANALYSIS]: 7,
    [MESSAGE_PROCESSING]: 7,
    [UPLOAD_FILE]: 9,
    [FILE_RETRIEVAL]: 9,
    [ORGANIZE_FILES]: 8,
    [FINANCE_ANALYSIS]: 7,
    [SEND_EMAIL]: 6,
    [FETCH_UNREAD_EMAILS]: 7,
    [SUMMARIZE_EMAILS]: 7,
    [SEARCH_EMAILS]: 8,
    [MEETING_SCHEDULING]: 6,
    [FETCH_UPCOMING_EVENTS]: 7,
    [MARKET_RESEARCH]: 7,
    [QUICK_ANSWERS]: 8,
    [REPORT_GENERATION]: 7,
    [PROGRESS_TRACKING]: 7,
    [HEALTH_REMINDERS]: 6,
  },
};

// Fallback preferences in case the best model is unavailable
const MODEL_FALLBACK_ORDER = {
  [OPENAI]: [ANTHROPIC, GEMINI, MISTRAL, COHERE, HUGGINGFACE, GROK],
  [ANTHROPIC]: [OPENAI, GEMINI, MISTRAL, COHERE, HUGGINGFACE, GROK],
  [COHERE]: [OPENAI, ANTHROPIC, GEMINI, HUGGINGFACE, MISTRAL, GROK],
  [HUGGINGFACE]: [OPENAI, ANTHROPIC, MISTRAL, GEMINI, COHERE, GROK],
  [MISTRAL]: [OPENAI, ANTHROPIC, GEMINI, HUGGINGFACE, COHERE, GROK],
  [GEMINI]: [OPENAI, ANTHROPIC, MISTRAL, HUGGINGFACE, COHERE, GROK],
  [GROK]: [OPENAI, GEMINI, ANTHROPIC, MISTRAL, HUGGINGFACE, COHERE],
};

// Default model mappings
const DEFAULT_TASK_MODEL_MAPPING = {
  [RESEARCH_ANALYSIS]: HUGGINGFACE,
  [MESSAGE_PROCESSING]: OPENAI,
  [UPLOAD_FILE]: GROK,
  [FILE_RETRIEVAL]: GROK,
  [ORGANIZE_FILES]: MISTRAL,
  [FINANCE_ANALYSIS]: HUGGINGFACE,
  [SEND_EMAIL]: ANTHROPIC,
  [FETCH_UNREAD_EMAILS]: ANTHROPIC,
  [SUMMARIZE_EMAILS]: GEMINI,
  [SEARCH_EMAILS]: OPENAI,
  [MEETING_SCHEDULING]: OPENAI,
  [FETCH_UPCOMING_EVENTS]: MISTRAL,
  [MARKET_RESEARCH]: HUGGINGFACE,
  [QUICK_ANSWERS]: GEMINI,
  [REPORT_GENERATION]: COHERE,
  [PROGRESS_TRACKING]: GEMINI,
  [HEALTH_REMINDERS]: ANTHROPIC,
};

// =======================
// Get the best available AI model for a specific task based on user's API keys
// =======================
export const getModelForTask = (
  taskType,
  availableModels = [],
  context = {}
) => {
  if (!availableModels || availableModels.length === 0) {
    console.warn("No models available - user has not stored any API keys");
    return null;
  }

  // Get the default preferred model for this task
  const defaultModel = DEFAULT_TASK_MODEL_MAPPING[taskType] || OPENAI;

  // If the user has the default model available, use it
  if (availableModels.includes(defaultModel)) {
    return defaultModel;
  }

  // Otherwise, find the best available model based on capabilities
  let bestModel = null;
  let bestScore = -1;

  availableModels.forEach((model) => {
    const capabilities = MODEL_CAPABILITIES[model] || {};
    const score = capabilities[taskType] || 0;

    // Apply context adjustments if needed
    let adjustedScore = score;

    // Example: Adjust score based on task complexity
    if (context.complexity === "high" && model === ANTHROPIC) {
      adjustedScore += 1;
    }

    // Example: Adjust score based on response time needs
    if (context.urgent && (model === OPENAI || model === GEMINI)) {
      adjustedScore += 1;
    }

    if (adjustedScore > bestScore) {
      bestScore = adjustedScore;
      bestModel = model;
    }
  });

  // If we found a suitable model, return it
  if (bestModel) {
    return bestModel;
  }

  // As a last resort, try to find a fallback based on the fallback order
  if (MODEL_FALLBACK_ORDER[defaultModel]) {
    for (const fallbackModel of MODEL_FALLBACK_ORDER[defaultModel]) {
      if (availableModels.includes(fallbackModel)) {
        return fallbackModel;
      }
    }
  }

  // If all else fails, return the first available model
  return availableModels[0];
};

// =======================
// Get available models from user's stored API keys
// =======================
export const getUserAvailableModels = (user) => {
  if (
    !user ||
    !user.apiKeys ||
    !Array.isArray(user.apiKeys) ||
    user.apiKeys.length === 0
  ) {
    return [];
  }

  const availableModels = [];

  user.apiKeys.forEach((apiKey) => {
    if (apiKey.provider && apiKey.key) {
      switch (apiKey.provider.toLowerCase()) {
        case OPENAI:
          availableModels.push(OPENAI);
          break;
        case ANTHROPIC:
          availableModels.push(ANTHROPIC);
          break;
        case COHERE:
          availableModels.push(COHERE);
          break;
        case HUGGINGFACE:
          availableModels.push(HUGGINGFACE);
          break;
        case MISTRAL:
          availableModels.push(MISTRAL);
          break;
        case GEMINI:
          availableModels.push(GEMINI);
          break;
        case GROK:
          availableModels.push(GROK);
          break;
        default:
          break;
      }
    }
  });

  return availableModels;
};

// =======================
// Complete helper function to get the best model for a task based on user's available API keys
// =======================
export const selectBestModelForUser = async (
  taskType,
  userId,
  context = {}
) => {
  const user = await getUserById(userId);
  const availableModels = getUserAvailableModels(user);
  return getModelForTask(taskType, availableModels, context);
};
