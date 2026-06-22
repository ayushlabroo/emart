import { Prisma, prisma } from "@emart/database";
import type { Request, Response } from "express";
import type { SearchQuery } from "../validators/search";

// $queryRaw returns plain objects — not Prisma model instances.
// Decimal columns (mrp, price, discount) come back as strings from pg driver.
// BigInt columns (COUNT) come back as JS BigInt.
type SearchResult = {
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
  subcategoryId: string;
  subcategoryName: string;
  categoryId: string;
  categoryName: string;
  rank: number;
};

export async function searchArticles(_req: Request, res: Response) {
  const { q, categoryId, page, limit } = res.locals["query"] as SearchQuery;
  const skip = (page - 1) * limit;

  // This tsvector expression must exactly match the GIN index in the migration
  // so Postgres knows it can use the index instead of computing it row-by-row.
  const tsVec = Prisma.sql`(
    setweight(to_tsvector('english', a.name), 'A') ||
    setweight(to_tsvector('english', COALESCE(a.description, '')), 'B')
  )`;

  // plainto_tsquery is safer than to_tsquery — it treats the whole string as a
  // phrase and never throws a syntax error on arbitrary user input ("chips!!!" is fine).
  const tsQ = Prisma.sql`plainto_tsquery('english', ${q})`;

  // Optional filter — Prisma.empty is a no-op SQL fragment (empty string).
  const categoryFilter = categoryId
    ? Prisma.sql`AND c.id = ${categoryId}`
    : Prisma.empty;

  const [items, countRows] = await Promise.all([
    prisma.$queryRaw<SearchResult[]>(Prisma.sql`
      SELECT
        a.id,
        a.name,
        a.description,
        a.photo,
        a.mrp,
        a.price,
        a.unit,
        a.discount,
        a.avg_rating    AS "avgRating",
        a.review_count  AS "reviewCount",
        s.id            AS "subcategoryId",
        s.name          AS "subcategoryName",
        c.id            AS "categoryId",
        c.name          AS "categoryName",
        ts_rank(${tsVec}, ${tsQ}) AS rank
      FROM   articles      a
      JOIN   subcategories s ON s.id = a.subcategory_id
      JOIN   categories    c ON c.id = s.category_id
      WHERE  a.is_active = true
        AND  ${tsVec} @@ ${tsQ}
        ${categoryFilter}
      ORDER  BY rank DESC, a.name ASC
      LIMIT  ${limit}
      OFFSET ${skip}
    `),

    prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
      SELECT COUNT(*) AS count
      FROM   articles      a
      JOIN   subcategories s ON s.id = a.subcategory_id
      JOIN   categories    c ON c.id = s.category_id
      WHERE  a.is_active = true
        AND  ${tsVec} @@ ${tsQ}
        ${categoryFilter}
    `),
  ]);

  const total = Number(countRows[0]?.count ?? 0);

  res.json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
