import MarketResearch from "../models/MarketResearch.js";

export const saveMarketResearch = async (userId, query, summary, sources) => {
  await MarketResearch.create({ userId, query, summary, sources });
};
