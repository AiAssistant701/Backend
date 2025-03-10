import axios from "axios";
import User from "../models/User.js";
import { decrypt } from "./crypto.js";
import {
  OPENAI,
  COHERE,
  HUGGINGFACE,
  ANTHROPIC,
  MISTRAL,
  GEMINI,
  GROK,
} from "./constants.js";
import { embedText } from "./huggingfaceInference.js";
import pinecone from "../services/pinecone/pineconeClient.js";

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
    case OPENAI:
      apiUrl = "https://api.openai.com/v1/chat/completions";
      payload = {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
      };
      break;

    case COHERE:
      apiUrl = "https://api.cohere.ai/v2/chat";
      payload = {
        model: "command-r-plus",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
      };
      break;

    case HUGGINGFACE:
      apiUrl =
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";
      payload = { inputs: prompt, parameters: { max_new_tokens: 200 } };
      break;

    case ANTHROPIC:
      apiUrl = "https://api.anthropic.com/v1/messages";
      payload = {
        model: "claude-3-opus-20240229",
        system: "You are an AI assistant. Answer concisely.",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 512,
      };
      headers["x-api-key"] = apiKey; // Anthropic uses `x-api-key`
      headers["anthropic-version"] = "2023-06-01";
      break;

    case MISTRAL:
      apiUrl = "https://api.mistral.ai/v1/chat/completions";
      payload = {
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
      };
      break;

    case GEMINI:
      apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`;
      payload = {
        contents: [{ parts: [{ text: prompt }] }],
      };
      headers = { "Content-Type": "application/json" };
      break;

    case GROK:
      apiUrl = "https://api.x.ai/v1/chat/completions";
      payload = {
        model: "grok-2-latest",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
      };
      break;

    default:
      throw new Error("Provider not supported");
  }

  try {
    // Retrieve similar past prompts using Pinecone
    const embedding = await embedText(prompt);
    const index = pinecone.index(process.env.PINECONE_INDEX);
    const queryResults = await index.query({
      vector: embedding,
      topK: 3, // Fetch top 3 similar responses
      includeMetadata: true,
    });

    // Inject relevant past responses as context
    const similarResponses = queryResults.matches
      .map((match) => match.metadata?.response)
      .filter(Boolean)
      .join("\n");

    if (similarResponses) {
      if (provider === ANTHROPIC) {
        payload.system = `Here is relevant context:\n\n${similarResponses}`;
      } else if (provider === GEMINI) {
        payload.contents[0].parts[0].text = `Context: ${similarResponses}\n\nUser: ${prompt}`;
      } else if (provider === MISTRAL) {
        payload.messages[0].content = `Context: ${similarResponses}\n\nUser: ${prompt}`;
      } else {
        payload.prompt = `Context: ${similarResponses}\n\nUser: ${prompt}`;
      }
    }

    const response = await axios.post(apiUrl, payload, { headers });

    let aiResponse;
    switch (provider) {
      case OPENAI:
      case GROK:
        aiResponse = response.data.choices?.[0]?.message?.content;
        break;
      case COHERE:
        aiResponse = response.data.message?.content[0].text;
        break;
      case HUGGINGFACE:
        let initialResponse = response.data[0]?.generated_text;
        aiResponse = initialResponse.replace(/^.*?\n+\s*/, "");
        break;
      case ANTHROPIC:
        aiResponse = response.data?.content[0].text;
        break;
      case MISTRAL:
        aiResponse = response.data?.choices[0].message.content;
        break;
      case GEMINI:
        aiResponse = response.data.candidates?.[0]?.content.parts[0].text;
        break;
      default:
        aiResponse = "Unknown provider response";
    }

    if (!aiResponse) {
      throw new Error(`Invalid response format from ${provider}`);
    }

    // Store response embedding in Pinecone
    const responseEmbedding = await embedText(aiResponse);
    await index.upsert([
      {
        id: `${userId}-${Date.now()}`,
        values: responseEmbedding,
        metadata: {
          prompt,
          response: aiResponse,
        },
      },
    ]);

    return aiResponse;
  } catch (error) {
    console.error(
      `API Error: ${JSON.stringify(error.response?.data, null, 2)}`
    );
    throw new Error(
      `API call failed for ${provider}: ${
        error.response?.data?.error || error.message
      }`
    );
  }
};
