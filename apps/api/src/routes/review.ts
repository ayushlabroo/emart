// apps/api/src/routes/review.ts
import { UserRole } from "@emart/types";
import { type Router, Router as createRouter } from "express";
import {
  createReview,
  deleteReview,
  listReviewsForArticle,
  updateReview,
} from "../controllers/review.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createReviewSchema,
  reviewQuerySchema,
  updateReviewSchema,
} from "../validators/review";

const router: Router = createRouter();

const customerOnly = [authenticate, authorize(UserRole.CUSTOMER)];

router.post(
  "/",
  ...customerOnly,
  validate(createReviewSchema),
  createReview,
);

router.get(
  "/articles/:articleId",
  validate(reviewQuerySchema, "query"),
  listReviewsForArticle,
);

router.patch(
  "/:id",
  ...customerOnly,
  validate(updateReviewSchema),
  updateReview,
);

router.delete("/:id", ...customerOnly, deleteReview);

export { router as reviewRouter };
