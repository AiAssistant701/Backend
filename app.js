import app from "./server.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
