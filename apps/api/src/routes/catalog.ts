// apps/api/src/routes/catalog.ts
import { UserRole } from "@emart/types";
import { type Router, Router as createRouter } from "express";
import {
  createArticle,
  deleteArticle,
  getArticleById,
  listArticles,
  updateArticle,
} from "../controllers/article.controller";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "../controllers/category.controller";
import {
  createSubcategory,
  deleteSubcategory,
  getSubcategoryById,
  listSubcategories,
  updateSubcategory,
} from "../controllers/subcategory.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  articleQuerySchema,
  categoryQuerySchema,
  createArticleSchema,
  createCategorySchema,
  createSubcategorySchema,
  subcategoryQuerySchema,
  updateArticleSchema,
  updateCategorySchema,
  updateSubcategorySchema,
} from "../validators/catalog";

const router: Router = createRouter();

// Shorthand — yeh middleware combo baar baar lagega
const adminOnly = [authenticate, authorize(UserRole.ADMIN)];

// ─── Categories ────────────────────────────────────────────────────────────────

router.post(
  "/categories",
  ...adminOnly,
  validate(createCategorySchema),
  createCategory,
);
router.get(
  "/categories",
  validate(categoryQuerySchema, "query"),
  listCategories,
);
router.get("/categories/:id", getCategoryById);
router.patch(
  "/categories/:id",
  ...adminOnly,
  validate(updateCategorySchema),
  updateCategory,
);
router.delete("/categories/:id", ...adminOnly, deleteCategory);

// ─── Subcategories ─────────────────────────────────────────────────────────────

router.post(
  "/subcategories",
  ...adminOnly,
  validate(createSubcategorySchema),
  createSubcategory,
);
router.get(
  "/subcategories",
  validate(subcategoryQuerySchema, "query"),
  listSubcategories,
);
router.get("/subcategories/:id", getSubcategoryById);
router.patch(
  "/subcategories/:id",
  ...adminOnly,
  validate(updateSubcategorySchema),
  updateSubcategory,
);
router.delete("/subcategories/:id", ...adminOnly, deleteSubcategory);

// ─── Articles ──────────────────────────────────────────────────────────────────

router.post(
  "/articles",
  ...adminOnly,
  validate(createArticleSchema),
  createArticle,
);
router.get("/articles", validate(articleQuerySchema, "query"), listArticles);
router.get("/articles/:id", getArticleById);
router.patch(
  "/articles/:id",
  ...adminOnly,
  validate(updateArticleSchema),
  updateArticle,
);
router.delete("/articles/:id", ...adminOnly, deleteArticle);

export { router as catalogRouter };
