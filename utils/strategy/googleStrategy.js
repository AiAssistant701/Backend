import logger from "../logger.js";
import {
  getUserByEmail,
  createGoogleUser,
  updateUserWithTokens,
  saveUserTokens,
} from "../../usecases/users.js";

export const googleStrategyConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_API}/api/v1/auth/google/callback`,
  scope: [
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/drive.file",
  ],
  accessType: "offline",
  prompt: "consent",
  passReqToCallback: true,
};

export const handleGoogleAuth = async (
  req,
  access_token,
  refresh_token,
  profile,
  done
) => {
  try {
    const email = profile.emails[0]?.value;
    if (!email) {
      return done(null, false, { message: "No email provided from Google" });
    }

    const tokens = { access_token, refresh_token };
    const intent = req?.query?.state;
    let user = await getUserByEmail(email);

    if (intent === "connect") {
      await updateUserWithTokens(email, profile.id, tokens);
      return done(null, { googleId: profile.id, email, tokens });
    } else {
      if (!user) {
        user = await createGoogleUser(profile, access_token, refresh_token);
        if (!user) {
          return done(null, false, { message: "Failed to create user" });
        }
      } else {
        if (user.hasPassword) {
          return done(null, false, { message: "User is not a Google user" });
        }
        await saveUserTokens(user.googleAuth.googleId, tokens);
        user = { googleId: user.googleAuth.googleId, email: user.email, tokens };
      }
      return done(null, user);
    }
  } catch (error) {
    logger.error("Google Auth Error:", error);
    return done(null, false, { message: "Internal server error" });
  }
};
