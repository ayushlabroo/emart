// apps/api/src/routes/auth.ts
import { Router } from "express";
import {
  login,
  logout,
  me,
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

// "kaun hoon main?" — logged-in koi bhi user (name + email bhi DB se aata hai)
router.get("/me", authenticate, me);


export default router;
