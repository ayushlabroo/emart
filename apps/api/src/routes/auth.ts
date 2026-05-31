// apps/api/src/routes/auth.ts
import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../validators/auth";

const router: Router = Router();

// validate pehle chalega, pass hone par hi controller — middleware chain.
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

export default router;
