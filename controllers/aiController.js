import dotenv from "dotenv";
import { processUserRequest } from "../utils/taskProcessor.js";
import responseHandler from "../middlewares/responseHandler.js";

dotenv.config();

export const handleAIRequest = async (req, res, next) => {
  try {
    let user = req.user;
    const { provider, prompt } = req.body;

    const { result } = await processUserRequest({
      userId: user.id,
      googleId: user.googleId,
      prompt,
      provider,
      file: req.file,
    });

    return responseHandler(res, result, "AI Task Processed Successfully");
  } catch (error) {
    next(error);
  }
};
