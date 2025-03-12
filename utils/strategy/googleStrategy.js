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
    "profile",
    "email",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/drive.file",
  ],
  access_type: "offline",
  prompt: "consent",
  include_granted_scopes: true,
  approval_prompt: "force"
};

export const handleGoogleAuth = async (
  access_token,
  refresh_token,
  profile,
  done
) => {
  try {
    const email = profile.emails[0]?.value;

    if (!email) {
      return done(new Error("No email provided from Google"), false);
    }

    const tokens = { access_token, refresh_token };

    let user = await getUserByEmail(email);

    if (!user) {
      user = await createGoogleUser(profile, access_token, refresh_token);
      if (!user) {
        return done(new Error("Failed to create user"), false);
      }
    } else if (!user.googleId) {
      user = await updateUserWithTokens(email, profile.id, tokens); // Update existing user with Google credentials
    } else {
      await saveUserTokens(user.googleId, tokens);
      user = {
        googleId: user.googleId,
        email: user.email,
        tokens,
      }; // Update tokens for existing Google user
    }

    return done(null, user);
  } catch (error) {
    console.log("Google error", error);
    return done(error, false);
  }
};
