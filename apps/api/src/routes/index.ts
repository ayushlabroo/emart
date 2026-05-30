import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  return res.json({
    success: true,
    data: {
      status: "ok",
      service: "emart-api",
    },
  });
});

export default router;
