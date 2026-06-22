import { type Router, Router as createRouter } from "express";
import { searchArticles } from "../controllers/search.controller";
import { validate } from "../middleware/validate";
import { searchQuerySchema } from "../validators/search";

const router: Router = createRouter();

// Public — no auth needed. Anyone can search the catalog.
router.get("/", validate(searchQuerySchema, "query"), searchArticles);

export { router as searchRouter };
