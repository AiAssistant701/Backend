import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;
