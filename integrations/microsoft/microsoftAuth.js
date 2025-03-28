import qs from "qs";
import axios from "axios";
import logger from "../../utils/logger.js";

export const getMicrosoftAuthUrl = (state) => {
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams(
    {
      client_id: process.env.MICROSOFT_CLIENT_ID,
      response_type: "code",
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
      scope: "User.Read",
      state: state,
      prompt: "select_account",
    }
  )}`;
};

export const getMicrosoftTokens = async (code) => {
  try {
    const response = await axios.post(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

export const getMicrosoftProfile = async (accessToken) => {
  try {
    const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};
