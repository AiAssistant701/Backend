import AIDecisionLog from "../models/AIDecisionLogs.js";
import responseHandler from "../middlewares/responseHandler.js";

const logController = async (req, res, next) => {
  try {
    const { taskType, modelUsed, startDate, endDate, limit = 50 } = req.query;

    let query = {};
    if (taskType) query.taskType = taskType;
    if (modelUsed) query.modelUsed = modelUsed;

    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AIDecisionLog.find(query)
      .sort({ createdAt: -1 }) // Sort by latest first
      .limit(Number(limit));

    return responseHandler(res, logs, "AI Logs");
  } catch (error) {
    next(error);
  }
};

export { logController };
