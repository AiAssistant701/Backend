import axios from "axios";
import logger from "./logger.js";

export const apiRequest = async (url, method = "GET", data = null) => {
  try {
    const response = await axios({ url, method, data });
    return response.data;
  } catch (error) {
    logger.error(`API Request Failed: ${error.message}`);
    return { error: "API request failed", details: error.message };
  }
};
