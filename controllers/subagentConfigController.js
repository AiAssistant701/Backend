import responseHandler from "../middlewares/responseHandler.js";
import {
  getSubagentConfig,
  updateSubagentConfig,
} from "../usecases/subagentConfig.js";

export const fetchSubagentConfig = async (req, res, next) => {
  try {
    const { subagentType } = req.params;
    const userId = req.user.id;
    const config = await getSubagentConfig(userId, subagentType);
    return responseHandler(res, config, "Subagent config fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const updateSubagentConfiguration = async (req, res, next) => {
  try {
    const { subagentType } = req.params;
    const userId = req.user.id;
    const { config } = req.body;
    const updatedConfig = await updateSubagentConfig(
      userId,
      subagentType,
      config
    );
    return responseHandler(
      res,
      updatedConfig,
      "Subagent config updated successfully"
    );
  } catch (error) {
    next(error);
  }
};
