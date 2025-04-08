import axios from "axios";
import dotenv from "dotenv";
import logger from "../../utils/logger.js";
import { MARKET_RESEARCH } from "../../utils/constants.js";
import { chatbotService } from "../chatbotService.js";
import { saveMarketResearch } from "../../usecases/markets.js";
import { logAIDecision } from "../../usecases/aiDecicionLogs.js";

dotenv.config();

const GOOGLE_SEARCH_API = process.env.GOOGLE_SEARCH_API;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

// =======================
// Fetches market trends using Google Search & News API
// =======================
export const performMarketResearch = async (payload) => {
  try {
    const MAX_GOOGLE_RESULTS = 5;
    const MAX_NEWS_ARTICLES = 5;
    const startTime = Date.now(); // Start time for execution tracking

    const googleSearchResults = await axios.get(
      `https://www.googleapis.com/customsearch/v1?q=${payload.query}&key=${GOOGLE_SEARCH_API}&cx=${GOOGLE_CSE_ID}`
    );

    const newsResults = await axios.get(
      `https://newsapi.org/v2/everything?q=${payload.query}&apiKey=${NEWS_API_KEY}`
    );

    const googleSnippets =
      googleSearchResults.data.items
        ?.slice(0, MAX_GOOGLE_RESULTS)
        .map((item) => {
          const snippet = item.snippet || "No summary available.";
          return `${snippet} <a href="${item.link}" target="_blank" rel="noopener noreferrer">[Source]</a>`;
        })
        .join("<br><br>") || "";

    const newsDescriptions =
      newsResults.data.articles
        ?.slice(0, MAX_NEWS_ARTICLES)
        .map((article) => {
          const description =
            article.description || article.content || "No summary available.";
          return `${description} <a href="${article.url}" target="_blank" rel="noopener noreferrer">[Read more]</a>`;
        })
        .join("<br><br>") || "";

    const combinedText = [googleSnippets, newsDescriptions]
      .filter(Boolean)
      .join("<br><br>");

    payload.query = `Generate a summary for this market research: ${combinedText}`;

    // let response = await chatbotService(MARKET_RESEARCH, payload);

    // const summary = response.response;

    // Save market research
    // await saveMarketResearch(payload.userId, payload.query, summary, [
    //   //...googleSearchResults.data.items,
    //   ...newsResults.data.articles,
    // ]);

    // Calculate execution time
    const executionTime = Date.now() - startTime;

    // Log AI decision
    await logAIDecision(
      "MARKET_RESEARCH",
      payload.provider,
      0.95,
      "Summarized market research",
      executionTime
    );

    return {
      response: combinedText,
    };
  } catch (error) {
    logger.error("❌ Market Research Error:", error);
    throw new Error("Market research failed.", error.message);
  }
};
