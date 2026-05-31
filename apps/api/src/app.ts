import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { apiRateLimiter } from "./middleware/rate-limit";
import authRouter from "./routes/auth";
import { healthRouter } from "./routes/health";

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true, //
  }),
);

app.use(express.json({ limit: "100kb" }));

app.use(cookieParser());

app.use("/api", apiRateLimiter);
app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);

app.use(notFoundHandler);

app.use(errorHandler);

export { app };
