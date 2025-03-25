import logger from "../logger.js";

export const microsoftStrategyConfig = {
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: process.env.MICROSOFT_REDIRECT_URI,
  scope: ["User.Read", "openid", "email", "profile"],
  responseType: 'code',
  responseMode: 'query',
  tenant: "common",
  passReqToCallback: true,
  state: true,
  skipUserProfile: false
};

export const handleMicrosoftAuth = async (
  req,
  accessToken,
  refreshToken,
  params,
  profile,
  done
) => {
  console.log("=== MICROSOFT AUTH HANDLER EXECUTED ===");
  try {
    console.log("Profile:", profile);
    console.log("Tokens:", { accessToken, refreshToken });

    if (!profile) {
      throw new Error("No profile received from Microsoft");
    }

    const user = {
      id: profile.id,
      displayName: profile.displayName,
      email: profile._json.mail || profile._json.userPrincipalName,
      provider: "microsoft",
      accessToken,
      refreshToken: refreshToken || params.refresh_token,
    };

    logger.info("Microsoft auth success:", user);
    return done(null, user);
  } catch (error) {
    logger.error("Microsoft auth error:", error);
    return done(error, null);
  }
};
