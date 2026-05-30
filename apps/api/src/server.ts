import "dotenv/config";

import app from "./app.js";
import { logger } from "./lib/logger.js";

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  logger.info(`EMart API running on port ${PORT}`);
});
