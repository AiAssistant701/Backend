import logger from "../logger.js";
import { getUserByEmail, updateUserData } from "../../usecases/users.js";

export const microsoftStrategyConfig = {
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: process.env.MICROSOFT_REDIRECT_URI,
  scope: ["User.Read", "openid", "email", "profile"],
  responseType: "code",
  responseMode: "query",
  tenant: "common",
  passReqToCallback: true,
  state: true,
  skipUserProfile: false,
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
    const email = profile.emails[0]?.value;
    if (!email) {
      return done(null, false, { message: "No email provided from Google" });
    }

    const tokens = { access_token: accessToken, refresh_token: refreshToken };
    const user = await getUserByEmail(email);

    if (!user) {
      return done(null, false, { message: "User not found" });
    }

    const expiresAt = Date.now() + 3600000;

    await updateUserData(user.id, {
      microsoftAuth: {
        microsoftId: profile.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || params.refresh_token,
        expiresAt,
      },
    });


    logger.info("Microsoft auth success");
    return done(null, user);
  } catch (error) {
    logger.error("Microsoft auth error: " + error);
    return done(error, null);
  }
};
