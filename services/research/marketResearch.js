import axios from "axios";
import { saveMarketResearch } from "../../usecases/markets.js";
import { logAIDecision } from "../../usecases/aiDecicionLogs.js";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_SEARCH_API = process.env.GOOGLE_SEARCH_API;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

// =======================
// Fetches market trends using Google Search & News API
// =======================
export const performMarketResearch = async (payload) => {
  try {
    const startTime = Date.now(); // Start time for execution tracking

    const googleSearchResults = await axios.get(
      `https://www.googleapis.com/customsearch/v1?q=${payload.query}&key=${GOOGLE_SEARCH_API}&cx=${GOOGLE_CSE_ID}`
    );

    const newsResults = await axios.get(
      `https://newsapi.org/v2/everything?q=${payload.query}&apiKey=${NEWS_API_KEY}`
    );

    // Combine search & news results
    const combinedText =
      googleSearchResults.data.items.map((item) => item.snippet).join("\n") +
      "\n" +
      newsResults.data.articles
        .map((article) => article.description)
        .join("\n");

    const response = await axios.post(
      `${process.env.PYTHON_AI_URL}/summarize/`,
      {
        text: combinedText,
      }
    );

    const summary = response.data.summary;

    // Save market research
    await saveMarketResearch(payload.userId, payload.query, summary, [
      ...googleSearchResults.data.items,
      ...newsResults.data.articles,
    ]);

    // Calculate execution time
    const executionTime = Date.now() - startTime;

    // Log AI decision
    await logAIDecision(
      "MARKET_RESEARCH",
      "Hugging Face BART",
      0.95,
      "Summarized market research",
      executionTime
    );

    return {
      summary,
      sources: googleSearchResults.data.items,
      news: newsResults.data.articles,
    };
  } catch (error) {
    console.error("❌ Market Research Error:", error);
    throw new Error("Market research failed.", error.message);
  }
};
