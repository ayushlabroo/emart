// ─── Catalog API layer ────────────────────────────────────────────────────────
// Saari catalog (category / subcategory / article / search) API calls yahan.
// Components ke andar axios call NAHI karte — ek jagah change, sab jagah lagu.
import api from "@/lib/axios";

// ── Shared shapes (Prisma models match karte hain) ──────────────────────────────

export interface Category {
  id: string;
  name: string;
  photo: string | null; // photo null aa sakta hai
  isActive: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
  photo: string | null;
  categoryId: string;
}

// Article — Decimal fields (mrp/price/discount) JSON mein STRING banke aate hain.
export interface Article {
  id: string;
  name: string;
  description: string | null;
  photo: string | null;
  mrp: string;
  price: string;
  unit: string;
  discount: string;
  avgRating: number;
  reviewCount: number;
  isActive: boolean;
  subcategoryId: string;
  // getArticleById breadcrumb data deta hai (subcategory → category)
  subcategory?: {
    id: string;
    name: string;
    category?: { id: string; name: string };
  };
}

// ProductCard ko bas itne fields chahiye — Article AUR SearchResult dono yeh
// satisfy karte hain, isliye card dono jagah reuse ho jaata hai.
export interface ProductLike {
  id: string;
  name: string;
  photo: string | null;
  price: string | number;
  mrp: string | number;
  unit: string;
  avgRating: number;
  reviewCount: number;
}

// Search endpoint flat shape deta hai (subcategoryName/categoryName + rank)
export interface SearchResult extends ProductLike {
  description: string | null;
  discount: string;
  subcategoryId: string;
  subcategoryName: string;
  categoryId: string;
  categoryName: string;
  rank: number;
}

// List endpoints ka common shape
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ApiOk<T> = { success: true; data: T };

// ── Categories ──────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<ApiOk<Paginated<Category>>>(
    "/catalog/categories",
    { params: { limit: 50 } },
  );
  return data.data.items;
}

export async function getCategory(id: string): Promise<Category> {
  const { data } = await api.get<ApiOk<{ category: Category }>>(
    `/catalog/categories/${id}`,
  );
  return data.data.category;
}

// ── Subcategories ─────────────────────────────────────────────────────────────

export async function getSubcategoriesByCategory(
  categoryId: string,
): Promise<Subcategory[]> {
  const { data } = await api.get<ApiOk<Paginated<Subcategory>>>(
    "/catalog/subcategories",
    { params: { categoryId, limit: 50 } },
  );
  return data.data.items;
}

// ── Articles ──────────────────────────────────────────────────────────────────

export async function getArticlesBySubcategory(
  subcategoryId: string,
): Promise<Article[]> {
  const { data } = await api.get<ApiOk<Paginated<Article>>>(
    "/catalog/articles",
    { params: { subcategoryId, limit: 50 } },
  );
  return data.data.items;
}

export async function getArticle(id: string): Promise<Article> {
  const { data } = await api.get<ApiOk<{ article: Article }>>(
    `/catalog/articles/${id}`,
  );
  return data.data.article;
}

// ── Search ──────────────────────────────────────────────────────────────────────

export async function searchArticles(q: string): Promise<SearchResult[]> {
  const { data } = await api.get<ApiOk<Paginated<SearchResult>>>("/search", {
    params: { q, limit: 50 },
  });
  return data.data.items;
}
