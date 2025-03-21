import dotenv from "dotenv";
import { sanitizeControllerInput } from "../utils/helpers.js";
import { processUserRequest } from "../utils/taskProcessor.js";
import responseHandler from "../middlewares/responseHandler.js";

dotenv.config();

export const handleAIRequest = async (req, res, next) => {
  try {
    let user = req.user;
    let { provider, prompt } = req.body;

    provider = sanitizeControllerInput(provider);
    prompt = sanitizeControllerInput(prompt);

    console.log(user.id, user.googleId, prompt, provider);

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
