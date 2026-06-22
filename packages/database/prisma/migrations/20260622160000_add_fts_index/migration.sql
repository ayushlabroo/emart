-- GIN (Generalized Inverted Index) for full-text search on articles.
-- Weight A (name) > Weight B (description) — so "chips" in the product name
-- ranks higher than "chips" buried in a description paragraph.
-- This exact expression must match the query in search.controller.ts so Postgres
-- uses this index instead of doing a sequential scan.
CREATE INDEX articles_fts_idx ON articles
USING gin((
  setweight(to_tsvector('english', name), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
));
