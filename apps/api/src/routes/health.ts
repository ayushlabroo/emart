import { Router } from "express";

const router: Router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(), // abhi ka time
    },
  });
});

export { router as healthRouter };
