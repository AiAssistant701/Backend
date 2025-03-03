import axios from "axios";
import User from "../models/User.js";
import { decrypt } from "./crypto.js";

export const callAIModel = async (userId, provider, prompt) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const apiKeyEntry = user.apiKeys.find((key) => key.provider === provider);
  if (!apiKeyEntry) throw new Error(`API Key for ${provider} not found`);

  const apiKey = decrypt(apiKeyEntry.key);

  let apiUrl,
    payload,
    headers = { Authorization: `Bearer ${apiKey}` };

  switch (provider) {
    case "openai":
      apiUrl = "https://api.openai.com/v1/completions";
      payload = { model: "gpt-4", prompt, max_tokens: 100 };
      break;

    case "cohere":
      apiUrl = "https://api.cohere.ai/generate";
      payload = { model: "command-r", prompt, max_tokens: 100 };
      break;

    case "huggingface":
      apiUrl =
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
      payload = { inputs: prompt };
      break;

    case "anthropic":
      apiUrl = "https://api.anthropic.com/v1/complete";
      payload = { model: "claude-2", prompt, max_tokens: 100 };
      headers["x-api-key"] = apiKey; // Anthropic uses `x-api-key`
      break;

    case "mistral":
      apiUrl = "https://api.mistral.ai/v1/generate";
      payload = { model: "mistral-medium", prompt, max_tokens: 100 };
      break;

    default:
      throw new Error("Provider not supported");
  }

  // Make API request
  try {
    const response = await axios.post(apiUrl, payload, { headers });
    return response.data;
  } catch (error) {
    throw new Error(
      `API call failed for ${provider}: ${
        error.response?.data?.error || error.message
      }`
    );
  }
};
