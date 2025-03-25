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
  console.log("=== MICROSOFT AUTH HANDLER TRIGGERED ===");
  console.log("Request query:", req.query);
  console.log("Request params:", req.params);
  console.log("Full profile:", JSON.stringify(profile, null, 2));

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

    console.log("Processed user:", user);
    return done(null, user);
  } catch (error) {
    console.error("Error in Microsoft auth handler:", error);
    return done(error, null);
  }
};
