import winston from "winston";
import { env } from "../config/env";

// production hai ya nahi — ek baar nikaal lo, do jagah kaam aayega
const isProduction = env.NODE_ENV === "production";

const logger = winston.createLogger({
  // 1) LEVEL — iss level tak ke logs hi dikhao
  //    dev mein "debug" (sab kuch), production mein "info" (debug chhup jaaye)
  level: isProduction ? "info" : "debug",

  // 2) FORMAT — log dikhega kaisa
  format: isProduction
    ? winston.format.json() // machine padh sake — CloudWatch ke liye perfect
    : winston.format.combine(
        winston.format.colorize(), // terminal mein rang (dev mein aankhon ko aaram)
        winston.format.simple(), // insaan ke padhne layak
      ),

  // 3) TRANSPORTS — log JAATE KAHAN hain. Abhi sirf terminal (Console).
  transports: [new winston.transports.Console()],
});

export { logger };
