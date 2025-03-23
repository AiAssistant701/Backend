import responseHandler from "../middlewares/responseHandler.js";
import {
  getSubagentConfig,
  updateSubagentConfig,
} from "../usecases/subagentConfig.js";

// @route   GET /api/v1/subagents/:subagentType/config
// @desc    Gets a user's subagent configuration
export const fetchSubagentConfig = async (req, res, next) => {
  try {
    const { subagentType } = req.params;
    const userId = req.user.id;
    const config = await getSubagentConfig(userId, subagentType);

    if (!config) {
      return responseHandler(res, config, "Subagent config not found");
    }

    return responseHandler(res, config, "Subagent config fetched successfully");
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/subagents/:subagentType/config
// @desc    Update a user's subagent configuration
export const updateSubagentConfiguration = async (req, res, next) => {
  try {
    const { subagentType } = req.params;
    const userId = req.user.id;
    const { config } = req.body;
    console.log("config", config)
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
