export const microsoftStrategyConfig = {
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: process.env.MICROSOFT_REDIRECT_URI,
  scope: ["User.Read"],
  tenant: "common",
  state: true,
};

export const handleMicrosoftAuth = (
  req,
  accessToken,
  refreshToken,
  profile,
  done
) => {

  try {
    if (!profile) {
      throw new Error("No profile received from Microsoft");
    }

    const user = {
      id: profile.id,
      displayName: profile.displayName,
      email: profile._json.mail || profile._json.userPrincipalName,
      provider: "microsoft",
      accessToken,
      refreshToken,
    };

    logger.info("Processed user: " + user);
    return done(null, user);
  } catch (error) {
    logger.error("Error in Microsoft auth handler: " + error);
    return done(error, null);
  }
};
