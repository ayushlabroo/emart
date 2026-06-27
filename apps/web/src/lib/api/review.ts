// ─── Review API layer ─────────────────────────────────────────────────────────
import api from "@/lib/axios";

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { name: string };
}

export interface CreateReviewInput {
  articleId: string;
  rating: number;
  comment?: string;
}

interface ReviewsPage {
  reviews: Review[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

type ApiOk<T> = { success: true; data: T };

export async function listReviews(articleId: string): Promise<ReviewsPage> {
  const { data } = await api.get<ApiOk<ReviewsPage>>(
    `/reviews/articles/${articleId}`,
  );
  return data.data;
}

// createReview ka data review object SEEDHA hota hai (data: review, no wrapper key)
export async function createReview(input: CreateReviewInput): Promise<Review> {
  const { data } = await api.post<ApiOk<Review>>("/reviews", input);
  return data.data;
}
