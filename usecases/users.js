import User from "../models/User.js";

// =======================
// save user google tokens
// =======================
export const saveUserTokens = async (googleId, tokens) => {
  const user = await User.findOneAndUpdate(
    { googleId },
    { $set: { tokens } },
    { new: true }
  );

  return user ? user.toJSON() : null;
};

// =======================
// get user by googleId
// =======================
export const getUserByGoogleID = async (googleId) => {
  if (!googleId) return null;
  const user = await User.findOne({ googleId });
  return user ? user.toJSON() : null;
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
        "tokens.access_token": tokens.access_token,
        "tokens.refresh_token": tokens.refresh_token,
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
  return user ? user.toJSON() : null;
};

// =======================
// get user data from db by id
// =======================
export const getUserById = async (id) => {
  const user = await User.findById(id);
  return user ? user.toJSON() : null;
};

// =======================
// get user data from db by phone number
// =======================
export const getUserByPhoneNumber = async (phoneNumber) => {
  const user = await User.findOne({ phoneNumber });
  return user ? user.toJSON() : null;
};

// =======================
// create new google user
// =======================
export const createGoogleUser = async (
  profile,
  access_token,
  refresh_token
) => {
  const user = await User.create({
    googleId: profile.id,
    name: profile.displayName,
    email: profile.emails[0].value,
    firstName: profile.name.givenName,
    lastName: profile.name.familyName,
    emailVerified: true,
    tokens: { access_token, refresh_token },
  });

  return user ? user.toJSON() : null;
};
