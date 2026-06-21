import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { apiRateLimiter } from "./middleware/rate-limit";
import { addressRouter } from "./routes/address";
import authRouter from "./routes/auth";
import { cartRouter } from "./routes/cart";
import { catalogRouter } from "./routes/catalog";
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
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/addresses", addressRouter);

app.use(notFoundHandler);

app.use(errorHandler);

export { app };
