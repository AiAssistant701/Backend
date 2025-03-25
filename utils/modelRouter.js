import logger from "./logger.js";
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

// Task category mapping for capability grouping
const TASK_CAPABILITY_MAPPING = {
  [RESEARCH_ANALYSIS]: ["research", "analysis", "comprehension"],
  [MESSAGE_PROCESSING]: ["textGeneration", "communication"],
  [UPLOAD_FILE]: ["fileHandling", "dataProcessing"],
  [FILE_RETRIEVAL]: ["fileHandling", "search"],
  [ORGANIZE_FILES]: ["organization", "categorization"],
  [FINANCE_ANALYSIS]: ["analysis", "finance", "math"],
  [SEND_EMAIL]: ["communication", "writing"],
  [FETCH_UNREAD_EMAILS]: ["retrieval", "communication"],
  [SUMMARIZE_EMAILS]: ["summarization", "communication"],
  [SEARCH_EMAILS]: ["search", "retrieval"],
  [MEETING_SCHEDULING]: ["scheduling", "organization"],
  [FETCH_UPCOMING_EVENTS]: ["retrieval", "scheduling"],
  [MARKET_RESEARCH]: ["research", "analysis", "business"],
  [QUICK_ANSWERS]: ["factRetrieval", "responseSpeed"],
  [REPORT_GENERATION]: ["writing", "structuring", "analysis"],
  [PROGRESS_TRACKING]: ["organization", "monitoring"],
  [HEALTH_REMINDERS]: ["reminders", "health", "personalization"],
};

// Model strengths by capability area (0-10 scale)
const MODEL_CAPABILITY_STRENGTHS = {
  [OPENAI]: {
    textGeneration: 9,
    search: 9,
    scheduling: 8,
    communication: 8,
    summarization: 8,
    responseSpeed: 9,
    analysis: 7,
    research: 7,
    organization: 7,
  },
  [ANTHROPIC]: {
    communication: 9,
    writing: 9,
    research: 8,
    analysis: 8,
    summarization: 8,
    health: 9,
    personalization: 8,
    textGeneration: 8,
  },
  [COHERE]: {
    structuring: 9,
    writing: 8,
    research: 7,
    summarization: 7,
    analysis: 7,
    responseSpeed: 7,
  },
  [HUGGINGFACE]: {
    research: 9,
    analysis: 9,
    finance: 9,
    math: 8,
    business: 8,
  },
  [MISTRAL]: {
    organization: 9,
    scheduling: 8,
    fileHandling: 7,
    categorization: 8,
    analysis: 7,
  },
  [GEMINI]: {
    summarization: 9,
    responseSpeed: 9,
    monitoring: 9,
    research: 8,
    writing: 8,
    analysis: 7,
  },
  [GROK]: {
    fileHandling: 9,
    dataProcessing: 8,
    search: 8,
    organization: 8,
    responseSpeed: 8,
  },
};

// =======================
// Get the best available AI model for a specific task based on user's API keys
// =======================
export const getModelForTaskWithReasoning = (
  taskType,
  availableModels = [],
  context = {}
) => {
  // Initialize response object
  const response = {
    selectedModel: null,
    taskType: taskType,
    selectionReasoning: {
      defaultModel: DEFAULT_TASK_MODEL_MAPPING[taskType] || OPENAI,
      defaultAvailable: false,
      availableModels: [...availableModels],
      scoreBreakdown: [],
      fallbacksConsidered: false,
    },
    capabilities: {},
    alternativeOptions: [],
  };

  if (!availableModels || availableModels.length === 0) {
    logger.info("No models available - user has not stored any API keys");
    return response;
  }

  // Get the default preferred model for this task
  const defaultModel = DEFAULT_TASK_MODEL_MAPPING[taskType] || OPENAI;

  // If the user has the default model available, use it
  if (availableModels.includes(defaultModel)) {
    response.selectedModel = defaultModel;
    response.selectionReasoning.defaultAvailable = true;

    // Still calculate scores for all models for comparison
    const scores = calculateModelScores(taskType, availableModels, context);
    response.selectionReasoning.scoreBreakdown = scores;

    // Fill in capabilities
    response.capabilities = getModelCapabilitiesForTask(defaultModel, taskType);

    // Generate alternatives
    response.alternativeOptions = generateAlternativeOptions(
      defaultModel,
      availableModels,
      scores
    );

    return response;
  }

  // Calculate scores for all available models
  const scores = calculateModelScores(taskType, availableModels, context);
  response.selectionReasoning.scoreBreakdown = scores;

  // Find the best model based on scores
  if (scores.length > 0) {
    // Sort by adjusted score descending
    scores.sort((a, b) => b.adjustedScore - a.adjustedScore);
    response.selectedModel = scores[0].model;

    // Fill in capabilities for the selected model
    response.capabilities = getModelCapabilitiesForTask(
      response.selectedModel,
      taskType
    );

    // Generate alternatives
    response.alternativeOptions = generateAlternativeOptions(
      response.selectedModel,
      availableModels,
      scores
    );

    return response;
  }

  // If no suitable model found, try fallbacks
  response.selectionReasoning.fallbacksConsidered = true;
  if (MODEL_FALLBACK_ORDER[defaultModel]) {
    for (const fallbackModel of MODEL_FALLBACK_ORDER[defaultModel]) {
      if (availableModels.includes(fallbackModel)) {
        response.selectedModel = fallbackModel;
        response.capabilities = getModelCapabilitiesForTask(
          fallbackModel,
          taskType
        );
        return response;
      }
    }
  }

  // Last resort: use first available model
  if (availableModels.length > 0) {
    response.selectedModel = availableModels[0];
    response.capabilities = getModelCapabilitiesForTask(
      availableModels[0],
      taskType
    );
  }

  return response;
};

// =======================
// Helper function to calculate scores for all available models
// =======================
const calculateModelScores = (taskType, availableModels, context) => {
  const scores = [];

  availableModels.forEach((model) => {
    const capabilities = MODEL_CAPABILITIES[model] || {};
    const baseScore = capabilities[taskType] || 0;

    // Track score adjustments for transparency
    const adjustments = [];
    let adjustedScore = baseScore;

    // Apply context adjustments
    if (context.complexity === "high" && model === ANTHROPIC) {
      adjustedScore += 1;
      adjustments.push({ reason: "complexity", value: 1 });
    }

    if (context.urgent && (model === OPENAI || model === GEMINI)) {
      adjustedScore += 1;
      adjustments.push({ reason: "urgent", value: 1 });
    }

    // Add domain-specific adjustments
    if (context.domain === "finance" && model === HUGGINGFACE) {
      adjustedScore += 1;
      adjustments.push({ reason: "domain:finance", value: 1 });
    }

    if (context.creativity === "high" && model === ANTHROPIC) {
      adjustedScore += 1;
      adjustments.push({ reason: "creativity", value: 1 });
    }

    scores.push({
      model,
      baseScore,
      adjustedScore,
      adjustments,
    });
  });

  return scores;
};

// =======================
// Helper function to extract relevant capabilities for a model and task
// =======================
const getModelCapabilitiesForTask = (model, taskType) => {
  const capabilities = {};

  // Get capability categories relevant to this task
  const relevantCapabilities = TASK_CAPABILITY_MAPPING[taskType] || [];

  // For each relevant capability, get the model's strength
  relevantCapabilities.forEach((capability) => {
    if (
      MODEL_CAPABILITY_STRENGTHS[model] &&
      MODEL_CAPABILITY_STRENGTHS[model][capability] !== undefined
    ) {
      capabilities[capability] = MODEL_CAPABILITY_STRENGTHS[model][capability];
    }
  });

  return capabilities;
};

// =======================
// Helper function to generate ranked alternative options
// =======================
const generateAlternativeOptions = (selectedModel, availableModels, scores) => {
  // Sort scores by adjusted score descending
  const sortedScores = [...scores].sort(
    (a, b) => b.adjustedScore - a.adjustedScore
  );

  // Create alternatives, excluding the selected model
  const alternatives = sortedScores
    .filter((score) => score.model !== selectedModel)
    .map((score, index) => ({
      model: score.model,
      score: score.adjustedScore,
      rank: index + 2, // +2 because the selected model is rank 1
    }));

  // Add top unavailable models as suggestions
  const allModels = [
    OPENAI,
    ANTHROPIC,
    GEMINI,
    MISTRAL,
    HUGGINGFACE,
    COHERE,
    GROK,
  ];
  const unavailableModels = allModels.filter(
    (model) => !availableModels.includes(model)
  );

  // Get top 2 unavailable models that would be good for this task
  const topUnavailableModels = unavailableModels
    .map((model) => ({
      model,
      score: MODEL_CAPABILITIES[model]?.[scores[0].taskType] || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item, index) => ({
      model: item.model,
      score: item.score,
      rank: alternatives.length + index + 2,
      unavailable: true,
    }));

  return [...alternatives, ...topUnavailableModels];
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
// Original helper function
// =======================
export const getModelForTask = (
  taskType,
  availableModels = [],
  context = {}
) => {
  const response = getModelForTaskWithReasoning(
    taskType,
    availableModels,
    context
  );
  return response.selectedModel;
};

// =======================
// Complete helper function to get the best model for a task based on user's available API keys
// with detailed reasoning for the frontend
// =======================
export const selectBestModelForUserWithReasoning = async (
  taskType,
  userId,
  context = {}
) => {
  const user = await getUserById(userId);
  const availableModels = getUserAvailableModels(user);
  return getModelForTaskWithReasoning(taskType, availableModels, context);
};

// =======================
// Legacy function preserved for backward compatibility
// =======================
export const selectBestModelForUser = async (
  taskType,
  userId,
  context = {}
) => {
  const result = await selectBestModelForUserWithReasoning(
    taskType,
    userId,
    context
  );
  return result;
};
