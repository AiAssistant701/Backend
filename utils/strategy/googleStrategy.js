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
  approval_prompt: "force",
  passReqToCallback: true
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
      return done(new Error("No email provided from Google"), false);
    }

    const tokens = { access_token, refresh_token };

    const intent = req && req.query && req.query.state;

    let user = await getUserByEmail(email);
    if (intent === "connect") {
      if(user.googleId) {
        return done(new Error("User is already linked to google"), false);
      }
      await updateUserWithTokens(email, profile.id, tokens);

      return done(null, {
        googleId: profile.id,
        email,
        tokens,
      });
    } else {
      if (!user) {
        user = await createGoogleUser(profile, access_token, refresh_token);
        if (!user) {
          return done(new Error("Failed to create user"), false);
        }
      } else {
        if (user.hasPassword) {
          return done(new Error("User is not a google user"), false);
        }
        
        await saveUserTokens(user.googleId, tokens);
        user = {
          googleId: user.googleId,
          email: user.email,
          tokens,
        };
      }
      return done(null, user);
    }
  } catch (error) {
    console.log("Google error", error);
    return done(error, false);
  }
};
