import qs from "qs";
import axios from "axios";

export const getMicrosoftAuthUrl = () => {
  const scopes = ["Mail.ReadWrite", "Files.ReadWrite.All"].join(" ");
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${process.env.MICROSOFT_REDIRECT_URI}&scope=${scopes}`;
};

export const getMicrosoftTokens = async (code) => {
  const response = await axios.post(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    qs.stringify({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      code,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return response.data; // { access_token, refresh_token, expires_in }
};