# EMart Build Roadmap

> Each step below is designed to be **one self-contained chat thread**.
> Open a new chat, paste your project instructions (or rely on the project
> context if you're using Claude Projects), and say *"Let's do Step N."*
> Each step has a clear *done* state so you know when to move on.

**Your setup**: Based in India → use AWS region `ap-south-1` (Mumbai) for
everything. Brand-new to AWS → Step 1 will be a careful, slow walkthrough
of account setup and billing guardrails before any resource is created.

---

## Phase 0 — Pre-build Safety & Accounts

*Do this BEFORE writing any code.*

- **Step 1** — AWS account setup + billing guardrails
  Root MFA, IAM user for daily use, 3 budgets ($10/$25/$40), Cost Anomaly
  Detection, Cost Explorer, resource tagging policy.

- **Step 2** — Create accounts for all other services
  GitHub, Vercel, OpenAI (with hard limit set!), Sentry, Cloudinary, Expo.
  Set billing alerts where applicable.

---

## Phase 1 — Foundation

*The core working app. Don't move to Phase 2 until this is deployed.*

- **Step 3** — Local dev environment
  Node version manager (nvm/fnm), pnpm, Docker Desktop, VS Code extensions,
  Git config, SSH keys.

- **Step 4** — Turborepo monorepo skeleton
  `apps/` and `packages/` folders, root `package.json`, `turbo.json`,
  `.env.example`, `.gitignore`.

- **Step 5** — Shared packages scaffolding
  `packages/types`, `packages/utils`, `packages/ui` (design tokens only,
  NOT shared components — web uses HTML/CSS, mobile uses RN primitives).

- **Step 6** — Database setup in `packages/database`
  Prisma init, start on **Neon** (free, auto-suspend protects you from
  idle billing), plan migration to AWS RDS for Step 20.

- **Step 7** — Prisma schema design *(big one — may span 2–3 threads)*
  Users, products, categories, dark stores, inventory, orders, cart,
  category-specific JSON attributes for grocery/GM/electronics.

- **Step 8** — Express API skeleton
  TypeScript, folder structure, Zod, Helmet, express-rate-limit, Winston
  logging, global error handler, consistent response shape.

- **Step 9** — Auth system
  JWT access (15min) + refresh (7d), bcrypt, httpOnly cookies for web,
  role middleware, login/register/refresh endpoints.

- **Step 10** — Product catalog API
  List, filter, full-text search (Postgres built-in), single product.

- **Step 11** — Cart API
  Add, update, remove, sync, pin-code-based store routing logic.

- **Step 12** — Order API
  Place order, lifecycle transitions (placed → delivered), history,
  role-scoped views (customer vs store manager vs admin).

- **Step 13** — Next.js web app skeleton
  App Router, Tailwind, shadcn/ui, TanStack Query, Zustand, Axios client
  with cookie-based auth.

- **Step 14** — Web: auth pages
  Login, register, protected routes, role-aware UI rendering.

- **Step 15** — Web: catalog browse + product detail

- **Step 16** — Web: cart + checkout flow

- **Step 17** — Web: order history + tracking page

- **Step 18** — Web: Dark Store Manager dashboard
  Inventory management + order processing UI.

- **Step 19** — Web: Admin dashboard
  Users, catalog, dark stores management.

- **Step 20** — Migrate Neon → AWS RDS
  Only after Phase 1 features work locally. db.t3.micro, deletion
  protection on, storage cap at 20GB, Multi-AZ OFF.

- **Step 21** — AWS ElastiCache (Redis)
  Session caching, rate limiting backend, catalog caching.
  cache.t3.micro single node.

- **Step 22** — Deploy Express API to AWS App Runner
  Dockerfile, on-demand mode (not always-on), low max instances.

- **Step 23** — Deploy Next.js to Vercel
  Production env vars, CORS config for Express, custom domain (optional).

- **Step 24** — File storage: S3 + CloudFront
  Private buckets, presigned upload URLs, CloudFront with Price Class 100,
  upload size limits in Express.

**✅ Phase 1 done state**: A live URL where a customer can browse, add to
cart, check out, and see order status. Store manager can mark orders as
packed. Admin can add products.

---

## Phase 2 — Intelligence (LLM features)

*Only after Phase 1 is live and working.*

- **Step 25** — OpenAI hardening + Ollama for local dev
  Hard limit confirmed, API key rotation strategy, .env discipline,
  Ollama install for free local iteration.

- **Step 26** — LLM service layer in `apps/api` *(may span 2 threads)*
  Fallback chain (OpenAI → Gemini → Groq), token accounting, per-user
  rate limiting middleware specifically for LLM routes.

- **Step 27** — Customer support chatbot
  Function calling for safe DB queries, conversation history capped at
  last 10 turns, hallucination guardrails, max_tokens: 500.

- **Step 28** — Embeddings pipeline
  text-embedding-3-small, pgvector extension on RDS, product embedding
  backfill script.

- **Step 29** — Semantic search endpoint
  Hybrid keyword + vector ranking.

- **Step 30** — Recommendations engine
  "Frequently bought together", "for you" feed.

- **Step 31** — Admin natural-language analytics assistant

- **Step 32** — Typesense
  Decide: self-host on EC2 t3.micro (~$8/mo) vs Typesense Cloud free tier.

- **Step 33** — Sentry integration on web + api
  tracesSampleRate: 0.1 to stay in free tier.

- **Step 34** — CloudWatch logging + dashboards + alarms
  Winston → CloudWatch, key metrics, alarms for error rate spikes.

- **Step 35** — LLM evaluation harness
  Small labeled dataset, automated scoring for regression checks.

**✅ Phase 2 done state**: Chatbot works, semantic search returns relevant
results for fuzzy queries, recommendations show on product pages, errors
and LLM costs visible in dashboards.

---

## Phase 3 — Mobile

- **Step 36** — Expo project scaffolding in `apps/mobile`
  Expo Router, NativeWind, shared types from monorepo.

- **Step 37** — Mobile auth
  Expo SecureStore for JWT, login/register screens, refresh flow.

- **Step 38** — Mobile catalog + product detail screens

- **Step 39** — Mobile cart + checkout

- **Step 40** — Mobile order tracking + history

- **Step 41** — Push notifications
  Expo Push, server-side trigger on order status changes.

- **Step 42** — Deep linking + biometric auth
  Order tracking SMS links, Face ID / fingerprint login.

- **Step 43** — Mobile chatbot screen

- **Step 44** — EAS Build setup
  First internal build on TestFlight / Play Internal Testing.

**✅ Phase 3 done state**: Installable mobile app talking to the same API
with customer feature parity vs web.

---

## Phase 4 — Polish & Production-Readiness

- **Step 45** — AWS Cognito migration
  Google Sign In + Apple Sign In (Apple mandatory if iOS app has any
  social login).

- **Step 46** — Admin mobile app
  Separate Expo app vs role-gated screens — decide at this step.

- **Step 47** — Performance pass
  DB indexes, N+1 audit, image optimization, Lighthouse scores.

- **Step 48** — Load testing
  k6 or Artillery — find the breaking point before employers do.

- **Step 49** — Security audit
  Secrets scan, dependency audit, OWASP basics, presigned URL expiry
  review.

- **Step 50** — Portfolio polish
  README, architecture diagrams, demo video, GitHub repo cleanup.

---

## Working principles

1. **Each step = one new chat thread.** End each thread with a "state
   summary" you can paste into the next thread for continuity.

2. **Step 1 is non-negotiable.** Billing guardrails first. Always.

3. **Some steps will spawn sub-threads.** Step 7 (schema) and Step 26
   (LLM service layer) are the most likely candidates.

4. **Don't start Phase 2 until Phase 1 is deployed.** LLM features are
   the fun part — resist the urge to skip ahead.

5. **Mobile really does come last.** The headless architecture is what
   makes this possible — don't break it by starting mobile early.

6. **India-specific reminders**:
   - AWS bills in INR + 18% GST.
   - Use ap-south-1 (Mumbai) for ALL resources.
   - Apple Developer ($99/yr) and Google Play ($25 one-time) are USD.

---

*Generated for EMart project. Update this doc as the plan evolves.*