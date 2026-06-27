# EMart — Project Context for Claude Code

> This file is read automatically at the start of every Claude Code session.
> It defines how I want you to work with me. Read it fully before doing anything.

---

## 👤 Who I am / how to treat me (HIGHEST PRIORITY)

- This is my **first large-scale project**. I learn **by building** — weave
  teaching INTO the work, don't dump theory first and code later.
- My JavaScript is **very basic**: I know var/function, if/else, loops, basic
  arrays & objects. Assume I know **nothing** beyond that — no modern JS, no TS.
- Talk to me like a **friend sitting next to me**: casual, warm, patient,
  encouraging. Not like a textbook.
- **Real production concepts only.** No toy examples. If Swiggy/Zepto/Amazon
  wouldn't write it that way, don't teach it that way.
- Every example must use the **EMart domain** (products, orders, cart, dark
  stores, inventory) — never foo/bar/Person/Animal.

## 🗣️ Language

Explain in **Hinglish** (conversational Hindi + English technical terms). Keep
technical terms in English (Express, Prisma, JWT, async/await, type,
middleware) — those are the words I'll use with employers and in docs.

## 📚 How to explain code

- First time ANY modern JS/TS syntax appears, STOP and explain it with a tiny
  **"old way vs new way"** before moving on. Covers: let/const vs var, arrow
  fns, destructuring, spread/rest, template literals, **async/await + Promises
  (explain DEEPLY)**, import/export vs require, optional chaining `?.`, nullish
  `??`, ternary, short-circuit `&&`/`||`, map/filter/reduce/find. TS: what a
  "type" is and WHY TS exists, type vs interface, unions, optional `?`,
  param/return types, generics (go SLOW), inference, types vanish at runtime.
- Comment code generously AND explain in prose underneath.
- Explain every import: which library, why, what it does.
- Explain the request lifecycle when relevant:
  frontend → API route → middleware → controller → Prisma → DB → response.
- When a new PATTERN appears (middleware, error wrapper, hook), explain the
  pattern itself, not just this usage.

## 🧠 Pacing & retention

- **ONE concept at a time.** Never introduce 5 new things in one breath.
- **One file at a time**, breathing room between steps.
- If I simplify to explain, immediately follow with: "this was a learning
  shortcut — here's how it's actually done in production."
- After a meaty concept, give me a tiny **"your turn" challenge** or a one-line
  **recap question** so I absorb it before moving on.
- **Plan architecture before writing code.** Explain before implementing, ask
  if I want to proceed.

## 🪄 Tips & shortcuts — I want them all

Proactively share, relevant to what we're doing: VS Code shortcuts/extensions,
terminal/zsh tricks, pnpm/git/Prisma/Docker/AWS CLI shortcuts, pro habits
(debugging, naming, file org), and **"beginner mistake vs senior approach"**
side-by-sides. Label optional pro-tips clearly as optional.

## ✅ After every major implementation step, include:

- What we built
- Why it matters
- Common beginner mistakes (and how to avoid them)
- How companies handle this at scale
- What to learn next

---

## 💻 My environment

- **OS:** macOS (Apple Silicon, M-series, arm64). Shell: **zsh**. Use macOS/zsh
  commands — never Windows PowerShell/CMD.
- CLI installs via **Homebrew**. PATH/env in `~/.zshrc` (not .bashrc).
- **arm64:** Docker → pull/build arm64 or multi-arch by default; flag amd64-only
  images. Native modules (bcrypt, Prisma engines, sharp) must resolve arm64.
- **Node 20** for EMart (`.nvmrc` + fnm auto-switch). pnpm **10.32.0** (pinned
  via `packageManager`). Node 24 + pnpm 11 for global tools. `tsx` global.

---

## ⚠️ BILLING SAFETY (mandatory)

Before recommending ANY paid/freemium service, you MUST state:

1. Exact free tier limit
2. What action crosses into paid usage
3. Estimated monthly cost at portfolio traffic
4. How to set a spending alert / hard cap
5. Any "gotcha" charges easy to trigger accidentally

**Master rule:** Never add a card without (1) a spending limit/alert, (2)
knowing the free→paid trigger, (3) knowing how to kill the resource. No cap
feature = high risk, prefer an alternative.

Budget: **$10–30/month**. Region: **ap-south-1 (Mumbai)**. Tag everything
`Project=EMart, Env=Dev`. AWS bills in INR + 18% GST. Never commit secrets —
`.env` local, env vars in deploy; a leaked OpenAI key gets drained in minutes.
OpenAI: hard limit always. LLM calls only from `apps/api`. Flag: Multi-AZ, read
replicas, NAT Gateway, public S3 buckets, runaway API loops.

---

## 🏗️ Architecture (headless — one Express API for web + mobile)

```
[Next.js Web]   [React Native Mobile]
       \              /
        [Express REST API]   ← single backend, returns JSON
              |
       [PostgreSQL + Redis]
```

### Monorepo (Turborepo + pnpm workspaces)

```
emart/
├── apps/
│   ├── web/      ← Next.js 14+ (App Router, TS, Tailwind, shadcn/ui,
│   │               TanStack Query, Zustand, Zod, Axios)
│   ├── api/      ← Express 5 + TS (shared by web + mobile)
│   └── mobile/   ← React Native + Expo (Phase 3)
├── packages/
│   ├── database/ ← Prisma schema + client (ONLY apps/api imports it)
│   ├── types/    ← shared TS interfaces — SINGLE SOURCE OF TRUTH
│   ├── utils/    ← shared util functions
│   └── ui/       ← design tokens only (NOT shared components)
└── turbo.json, package.json, .env.example
```

### Key principles

- `/api/v1/...` versioning is **non-negotiable** (mobile can't hot-update).
- Response shape: `{ success: true, data }` / `{ success: false, error, code }`.
- Never expose raw DB errors to clients.
- Business logic + DB queries ONLY in `apps/api` — never in web/mobile.
- Internal packages point `main`/`types` to raw TS source (not `dist/`).
- Named exports preferred over default (rename-safe, better auto-import).
- `app.ts` and `server.ts` kept separate (testability).

---

## 🔐 Auth (Step 9 — current area)

- Access token: **15 min**. Refresh token: **7 days**, **DB-backed (Postgres)**,
  **rotated on use** (old invalidated, new issued). Reuse-detection = optional
  advanced step. NOT Redis (ephemeral, wrong place for long-lived tokens).
- Web: httpOnly cookies. Mobile: Expo SecureStore (later, never AsyncStorage).
- bcrypt for passwords. Role middleware on every route — never trust client role.
- Roles: `CUSTOMER`, `STORE_MANAGER`, `ADMIN`.

---

## 📍 CURRENT STATE (update this as we progress)

**Step 19 COMPLETE (full web frontend). Next: Step 20 (DB migrate Neon → AWS RDS).**

Done:

- ✅ Step 7 — Prisma schema
- ✅ Step 8 — Express API skeleton (Express 5 + TS, Zod env validation, Winston,
  middleware chain, health route, graceful shutdown, app.ts/server.ts split)
- ✅ Step 9a — Auth utils: lib/password.ts (bcrypt), lib/jwt.ts (sign/verify),
  JWT env vars in Zod config
- ✅ Step 9b — Register/login: Zod validators, auth.controller.ts (nested
  User+Customer create, P2002 handling, generic error to prevent user
  enumeration, isActive check), middleware/validate.ts, lib/cookies.ts
  (httpOnly/secure/sameSite), JWT in body + cookies
- ✅ Step 9c — Refresh token flow: RefreshToken model + migration, SHA-256 hashed
  tokens in DB, POST /auth/refresh (rotation), POST /auth/logout (revoke)
- ✅ Step 9d — authenticate middleware (cookie + Bearer header), authorize(...roles)
  factory middleware, Express Request type extended with req.user
- ✅ Step 10 — Catalog API: Category/Subcategory/Article CRUD (ADMIN only write,
  public read), pagination + filtering, soft delete for articles, Zod query
  validation via res.locals, 15 routes under /api/v1/catalog
- ✅ Step 11 — Cart API: stateless cart (CartItem rows, no separate Cart model),
  upsert on POST, ownership check via updateMany/deleteMany + count===0,
  subtotal computed on GET, 5 routes under /api/v1/cart (CUSTOMER only)
- ✅ Step 12 — Address API: CRUD + dedicated PATCH /:id/default, $transaction for
  default swap (atomic — no race condition), delete-default auto-promotes oldest
  remaining address, 5 routes under /api/v1/addresses (CUSTOMER only)
- ✅ Step 13 — Order API: full checkout flow (validate cart → validate address →
  find store per item → calculate totals → $transaction: create Order+OrderItems
  snapshot + atomic inventory decrement with stock>=qty guard + clear cart),
  listOrders (paginated), getOrder; CART_EMPTY / ITEM_UNAVAILABLE / OUT_OF_STOCK
  error codes added to ApiErrorCode in @emart/types; 3 routes under /api/v1/orders

- ✅ Step 14 — Store & Inventory API: Store CRUD (ADMIN, soft delete via isActive=false), inventory
  upsert via Prisma `upsert` (STORE_MANAGER own store + ADMIN any store), ownership check via
  Manager record lookup (userId → manager.id → store.managerId), 7 routes under /api/v1/stores

- ✅ Step 15 — Order Status Management: state machine (PLACED→ACCEPTED→PICKING→PACKED→
  OUT_FOR_DELIVERY→DELIVERED, RETURN_REQUESTED→RETURNED), STORE_MANAGER access via
  manager.stores lookup, customer cancel (PLACED/ACCEPTED only), customer return (DELIVERED only);
  RETURN_REQUESTED+RETURNED added to DB enum + migration; 3 routes added to /api/v1/orders

- ✅ Step 16 — Payment API (Razorpay): PaymentStatus enum (PENDING/PAID/FAILED/REFUNDED),
  Payment model (razorpayOrderId, razorpayPaymentId, amount in paise), paymentStatus on Order;
  POST /payments/create-order (idempotent — returns existing PENDING order), POST /payments/verify
  (HMAC-SHA256 signature verification, $transaction update Payment+Order), POST /payments/webhook
  (rawBody signature verify via express.json verify callback, idempotent payment.captured handler);
  rawBody captured in express.d.ts + app.ts; 3 routes under /api/v1/payments.
  Pending: Razorpay test credentials to be added to .env before live testing.

- ✅ Step 17 — Reviews & Ratings: Review model (@@unique([customerId, articleId]) DB-level duplicate block),
  avgRating + reviewCount denormalized on Article (recomputed in $transaction after every write),
  purchase verification (must have DELIVERED order for the article), aggregate queries (_avg, _count),
  ALREADY_REVIEWED + NOT_PURCHASED error codes; 4 routes under /api/v1/reviews (POST/GET/PATCH/DELETE).

- ✅ Step 18 — Product Search (Postgres Full-Text Search): GIN functional index on articles
  (setweight tsvector: name=A, description=B), $queryRaw with Prisma.sql fragments for safe
  parameterization, plainto_tsquery (user-input safe), ts_rank for relevance ordering,
  optional categoryId filter, JOIN to subcategories+categories for breadcrumb data;
  1 route GET /api/v1/search (public, no auth).

**Step 19 — Web Frontend (Next.js App Router) — IN PROGRESS**

- ✅ Step 19a — Scaffold: Next.js 14 (App Router), Tailwind CSS, TypeScript, ESLint; deps installed
  (TanStack Query v5, Zustand v4, Axios, React Hook Form, Zod, @hookform/resolvers);
  src/app/layout.tsx (root layout + metadata), src/app/page.tsx (homepage placeholder),
  globals.css (Tailwind directives); port 3001; verified `GET / 200`.

- ✅ Step 19b — Axios instance + interceptors: src/lib/axios.ts — in-memory accessToken
  (setAccessToken/getAccessToken exports), base instance (baseURL from NEXT_PUBLIC_API_URL,
  withCredentials:true), request interceptor (attach Bearer token), response interceptor
  (401 → /auth/refresh → retry with queue to handle concurrent 401s), redirect to /login on
  refresh failure; apps/web/.env.local with NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1.

- ✅ Step 19c — Login + Register pages: src/lib/validators/auth.ts (Zod schemas + inferred types),
  src/app/login/page.tsx, src/app/register/page.tsx — React Hook Form + zodResolver, server error
  display, isSubmitting loading state, setAccessToken on success, router.push("/") redirect,
  Link between pages. Zod pinned to 3.23.8 + @hookform/resolvers pinned to 3.9.0 (3.25.x broke
  Schema type compat). WEB_ORIGIN in apps/api/.env fixed to http://localhost:3001 (was 3000).

- ✅ Step 19d — Providers + state stores: lib/store/auth.ts (Zustand: user/setUser/clearUser),
  lib/store/cart.ts (count/setCount for navbar badge), components/providers.tsx ("use client"
  wrapper: QueryClientProvider with browser-singleton QueryClient + AuthHydrator that silently
  POST /auth/refresh → setAccessToken → GET /auth/me → setUser on page load, useRef guard for
  React 18 StrictMode double-effect, raw axios for refresh to avoid interceptor loop); layout.tsx
  wrapped in <Providers>; login/register pages call useAuthStore.getState().setUser(data.data.user);
  API: auth.controller.ts `me()` (DB fetch name+email+role, not just JWT payload), wired into
  GET /auth/me route (was inline handler returning req.user).

- ✅ Step 19e — Homepage: lib/api/catalog.ts (data layer: Category type, Paginated<T>, getCategories
  returns items[]); components/home/Header.tsx (auth-store greeting + cart badge, Zustand selector
  pattern), SearchBar.tsx (controlled input → router.push /search?q= with encodeURIComponent),
  CategoryGrid.tsx (FIRST useQuery: queryKey ["categories"] + queryFn getCategories, 4 states
  loading-skeleton/error/empty/success, photo-or-initial fallback, Links to /category/:id);
  app/page.tsx composes them (stays Server Component). Verified GET / 200 + new content rendered.

- ✅ Step 19f–19k — Full shopping flow (one batch). API data layer: lib/api/{catalog,cart,
  address,order,payment,review,error}.ts (typed fetch fns, ProductLike shared shape, Decimal→string).
  Hooks: hooks/useCart.ts (useQuery enabled:!!user + count sync to cart store), hooks/usePayment.ts
  (Razorpay: loadScript → createPaymentOrder → checkout → verifyPayment → invalidate). UI kit:
  components/ui/{Button,Spinner,EmptyState,RatingStars}.tsx + lib/{cn,format,orderStatus}.ts +
  lib/razorpay.ts (typed window.Razorpay). Shared: ProductCard, AddToCartButton (FIRST useMutation,
  stepper, invalidate cart), RequireAuth (waits auth `hydrated` flag before redirect), CartSync,
  PageShell, Header (logout + cart badge). Pages: /category/[id], /subcategory/[id], /search
  (Suspense-wrapped useSearchParams), /product/[id] (detail + reviews + write-review mutation),
  /cart, /checkout (address select/add + place order + Razorpay), /orders, /orders/[id]
  (cancel/return/pay-now). Auth store gained `hydrated`/`setHydrated`; AuthHydrator sets it in
  finally. Verified: `next build` clean (12 routes, lint+types pass) + all routes GET 200.
  Pending live test: API server (4000) + Razorpay test keys for end-to-end cart→pay flow.

Web frontend conventions established (Step 19):
- API calls ONLY in lib/api/* (never inside components). Each fn returns the unwrapped payload.
- useQuery for reads, useMutation + queryClient.invalidateQueries for writes.
- Protected pages: wrap inner content in <RequireAuth> (waits for auth `hydrated`).
- Money: prices arrive as strings (Prisma Decimal → JSON). Use formatINR() from lib/format.
- Dynamic route params via useParams<{id:string}>(); search params need a <Suspense> boundary.
- Razorpay amount is paise; keyId is public, secret never reaches client.

### Resolved issues to remember

- Prisma enum: `STORE_MANAGER` is canonical.
- Prisma namespace export bug fixed in packages/database/src/index.ts.
- Type guard `isPrismaKnownError(err): err is Prisma.PrismaClientKnownRequestError`
  in apps/api/src/lib/prisma-errors.ts (catch `err` is unknown; inline narrowing
  was flaky due to Prisma generated class type).
- Express 5 auto-catches async rejections — no asyncHandler wrapper needed.
- Express 5: `req.query` is getter-only — use `res.locals["query"]` to pass
  parsed query params from validate middleware to controllers.
- Express 5: `req.params[key]` type is `string | string[]` — always cast with
  `req.params["id"] as string` in controllers.
- Zod v4: `z.record()` requires 2 args — `z.record(z.string(), z.any())`.
- Prisma article update: cast `data` as `Prisma.ArticleUncheckedUpdateInput`
  when passing `subcategoryId` directly (FK vs relation type conflict).
- Ownership check pattern: use `updateMany`/`deleteMany` with `{ id, customerId }`
  in WHERE (not `update`/`delete` which only accept unique fields). count===0 → 404.
  Never 403 — don't leak ownership info to attackers.
- $transaction two flavours: array `[op1, op2]` for sequential batch (no inter-op
  deps); async callback `async (tx) => { ... }` when later ops depend on earlier
  results. Throw inside callback = full rollback.
- Inventory atomic decrement: inside $transaction use `updateMany` with
  `stock: { gte: qty }` in WHERE. count===0 → throw → rollback (optimistic
  concurrency — avoids oversell without SELECT FOR UPDATE).
- After schema change + migrate dev, always run `prisma generate` separately —
  migrate dev does NOT auto-regenerate the client in all setups (Prisma 7 + PrismaPg).
- Razorpay webhook signature: use rawBody (Buffer), not parsed JSON. Capture via
  express.json() verify callback in app.ts → req.rawBody. Extended in express.d.ts.
- Razorpay amount is in paise (₹1 = 100 paise). Use Math.round(total * 100).
- Review ownership check: use findFirst({ id, customerId }) → 404 for both not-found and
  wrong-owner cases (never 403 — don't leak existence to attackers).
- recalculateRating() runs inside $transaction with every review write — pass the `tx`
  client, not the global `prisma`, so the aggregate sees the just-written data.

### Stack

Express 5, Prisma 7 (PrismaPg driver adapter), Zod, Winston, jsonwebtoken,
bcrypt. DB: **Neon** (free tier, auto-suspends, low risk) → migrate to RDS at
Step 20. Redis (ElastiCache) comes at Step 21.

---

## 🚫 What to avoid

- Recommending a service without billing risks.
- Leaving a spending cap unconfigured.
- Business logic / DB queries in web or mobile.
- JWT in localStorage (web) or AsyncStorage (mobile).
- Hardcoded secrets.
- Multi-AZ / read replicas / NAT Gateway for a learning project without flagging.
- Skipping API versioning.
- Introducing many new tools in one response — pace the learning.
- Assuming I know DevOps — explain AWS steps in full.
