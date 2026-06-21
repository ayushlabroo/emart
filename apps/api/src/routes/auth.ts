// apps/api/src/routes/auth.ts
import { Router } from "express";
import type { Request, Response } from "express";
import {
  login,
  logout,
  refresh,
  register,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../validators/auth";

const router: Router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// "kaun hoon main?" — logged-in koi bhi user
router.get("/me", authenticate, (req: Request, res: Response) => {
  res.json({ success: true, data: { user: req.user } });
});


export default router;
