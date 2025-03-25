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

  const user = await User.findOne({
    "googleAuth.googleId": googleId,
  });

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
        googleAuth: {
          googleId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
        },
        emailVerified: true,
      },
    },
    { new: true, upsert: false }
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
  refresh_token,
  expires_in = 3600
) => {
  const user = await User.create({
    googleAuth: {
      googleId: profile.id,
      access_token: access_token,
      refresh_token: refresh_token,
      expiresAt: Date.now() + expires_in * 1000,
    },
    name: profile.displayName,
    email: profile.emails[0].value,
    firstName: profile.name.givenName,
    lastName: profile.name.familyName,
    emailVerified: true,
  });

  return user ? user.toJSON() : null;
};

// =======================
// fetches all users with google id
// =======================
export const getAllUsersWithGoogleId = async () => {
  const users = await User.find({ googleId: { $ne: null } }, "googleId email");

  return users.map((user) => user.toJSON());
};

// =======================
// fetches all users with setEmailAutoReply to on
// =======================
export const getUsersWithEmailAutoReplyOn = async () => {
  const users = await User.find({ setEmailAutoReply: "on" }, "googleId email");

  return users.map((user) => user.toJSON());
};

// =======================
// update user data
// =======================
export const updateUserData = async (userId, data) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      ...data,
      updatedAt: new Date(),
    },
    { new: true, runValidators: true }
  );

  return user ? user.toJSON() : null;
};
