import User from "../models/User.js";
import { encrypt, decrypt } from "../utils/crypto.js";

// =======================
// save user google tokens
// =======================
export const saveUserTokens = async (googleId, tokens) => {
  const user = await User.findOneAndUpdate(
    { googleId },
    { $set: { tokens } },
    { new: true }
  );

  return user ? user : null;
};

export const getUserTokens = async (googleId) => {
  const user = await User.findOne({ googleId });
  return user ? user.tokens : null;
};

// =======================
// update user with google tokens
// =======================
export const updateUserWithTokens = async (email, googleId, tokens) => {
  await User.findOneAndUpdate(
    { email },
    {
      $set: {
        googleId,
        "tokens.accessToken": tokens.accessToken,
        "tokens.refreshToken": tokens.refreshToken || "",
        emailVerified: true,
      },
    },
    { new: true }
  );
};

// =======================
// get user data from db by email
// =======================
export const getUserByEmail = async (email) => {
  const user = await User.findOne({ email });
  return user ? user : null;
};

// =======================
// create new google user
// =======================
export const createGoogleUser = async (profile, accessToken, refreshToken) => {
  const user = await User.create({
    googleId: profile.id,
    name: profile.displayName,
    email: profile.emails[0].value,
    firstName: profile.name.givenName,
    lastName: profile.name.familyName,
    emailVerified: true,
    tokens: { accessToken, refreshToken },
  });

  return user ? user : null;
};
