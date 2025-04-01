import axios from "axios";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import { getUserTaskHistory } from "../usecases/taskHistory.js";
import responseHandler from "../middlewares/responseHandler.js";
import { getUserById, updateUserData } from "../usecases/users.js";

// @route   GET /api/v1/users/profile/:userId
// @desc    Gets a user's profile
export const fetchUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await getUserById(userId);
    if (!user) return next({ statusCode: 400, message: "User not found" });

    if (userId !== req.user.id.toString()) {
      return next({
        statusCode: 403,
        message: "You are not authorized to update this user's profile",
      });
    }

    let isGoogleConnected = false;

    if (user.tokens.access_token) {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${user.tokens.access_token}`
        );

        isGoogleConnected = response.data && response.data.expires_in > 0;
      } catch (error) {
        logger.error("Error fetching Google token info: " + error.message);
        isGoogleConnected = false;
      }
    }

    const profile = {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isGoogleConnected,
    };

    responseHandler(res, profile, "User profile retrieved!");
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/users/apikeys
// @desc    Stores a user's api keys
export const storeApiKeys = async (req, res, next) => {
  try {
    const { userId, apiKeys } = req.body; // apiKeys = [{ provider, key }]

    const encryptedKeys = apiKeys.map(({ provider, key }) => ({
      provider: provider.toLowerCase(),
      key: encrypt(key),
    }));

    await User.findByIdAndUpdate(userId, {
      $push: { apiKeys: { $each: encryptedKeys } },
    });

    responseHandler(res, null, "API Keys stored successfully!");
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/users/apikeys/:userId
// @desc    Gets a user's api keys
export const getApiKeys = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return next({ statusCode: 400, message: "User not found" });

    const decryptedKeys = user.apiKeys.map(({ provider, key }) => ({
      provider,
      key: decrypt(key),
    }));

    responseHandler(res, decryptedKeys, "API Keys retrieved successfully!");
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/users/apikeys
// @desc    Updates a user's api keys
export const updateApiKeys = async (req, res, next) => {
  try {
    const { userId, apiKeys } = req.body; // apiKeys = [{ provider, key }]

    const encryptedKeys = apiKeys.map(({ provider, key }) => ({
      provider: provider.toLowerCase(),
      key: encrypt(key),
    }));

    await User.findByIdAndUpdate(userId, {
      $push: { apiKeys: { $each: encryptedKeys } },
    });

    responseHandler(res, null, "API Key updated successfully!");
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/users/apikeys
// @desc    Deletes a user's api keys
export const deleteApiKeys = async (req, res, next) => {
  try {
    const { userId, provider } = req.body;

    await User.updateOne({ _id: userId }, { $pull: { apiKeys: { provider } } });

    responseHandler(res, null, "API Key deleted successfully!");
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/users/task/history/:userId
// @desc    Gets a user's task history
export const fetchUserTaskHistory = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return next({
        statusCode: 400,
        message: "Please provide a user ID to fetch task history",
      });
    }

    const user = await User.findById(userId);
    if (!user) return next({ statusCode: 400, message: "User not found" });

    if (userId !== req.user.id.toString()) {
      return next({
        statusCode: 403,
        message: "You are not authorized to update this user's profile",
      });
    }

    const tasks = await getUserTaskHistory(userId);

    responseHandler(res, tasks, "User task history retrieved!");
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/users/:userId
// @desc    Updates a user's profile
export const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const data = req.body;

    if (userId !== req.user.id.toString()) {
      return next({
        statusCode: 403,
        message: "You are not authorized to update this user's profile",
      });
    }

    const user = await updateUserData(userId, data);

    if (!user) return next({ statusCode: 400, message: "User not found" });

    responseHandler(
      res,
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      "User profile updated!"
    );
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/v1/users/auto-reply
// @desc  Updates a user's auto-reply setting
export const updateAutoReplySetting = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { autoReply } = req.body;

    if (!autoReply) {
      return next({
        statusCode: 400,
        message: "Please provide an auto-reply setting",
      });
    }

    if (autoReply !== "on" && autoReply !== "off") {
      return next({
        statueCode: 400,
        message: "Invalid auto-reply setting. Must be 'on' or 'off'",
      });
    }

    if (userId !== req.user.id.toString()) {
      return next({
        statusCode: 403,
        message: "You are not authorized to update this user's profile",
      });
    }

    const settings = await updateUserData(userId, {
      setEmailAutoReply: autoReply,
    });

    if (!settings) return next({ statusCode: 400, message: "User not found" });

    return responseHandler(
      res,
      { autoReply: settings.autoReply },
      "Auto-reply setting updated successfully"
    );
  } catch (error) {
    next(error);
  }
};
