import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { errorHandler } from "./middleware/error-handler.js";
import routes from "./routes/index.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "2mb",
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }),
);

app.use("/api/v1", routes);

app.use(errorHandler);

export default app;
