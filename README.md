# EMart

Multi-category e-commerce platform combining grocery, general merchandise,
and electronics — built as a portfolio project.

## Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Web**: Next.js 14+ (App Router, TypeScript, Tailwind, shadcn/ui)
- **Mobile**: React Native with Expo (TypeScript, NativeWind)
- **API**: Express.js (TypeScript, Zod, JWT auth)
- **Database**: PostgreSQL via Prisma (Neon → AWS RDS)
- **Cache**: Redis via AWS ElastiCache
- **LLM**: OpenAI GPT-4o mini, pgvector for semantic search
- **Deploy**: Vercel (web) + AWS App Runner (api) + EAS (mobile)

## Structure

\`\`\`
emart/
├── apps/
│   ├── web/         Next.js web app
│   ├── api/         Express REST API
│   └── mobile/      Expo mobile app
└── packages/
    ├── database/    Prisma schema + client
    ├── types/       Shared TypeScript types
    ├── utils/       Shared utility functions
    └── ui/          Shared design tokens
\`\`\`

## Local development

\`\`\`bash
nvm use            # switches to Node 20 (reads .nvmrc)
pnpm install       # installs all workspaces
pnpm dev           # starts all apps in dev mode
\`\`\`

## Seed data & test accounts

Self-registration (`/register`) always creates a **CUSTOMER** — you cannot
sign up as an admin (security by design). Create the admin via the seed script:

```bash
pnpm --filter @emart/api seed:admin
# override defaults:
# ADMIN_EMAIL=you@emart.com ADMIN_PASSWORD=Secret@123 pnpm --filter @emart/api seed:admin
```

### Default admin credentials (local dev only)

| Field    | Value             |
| -------- | ----------------- |
| Email    | `admin@emart.com` |
| Password | `Admin@12345`     |
| Role     | `ADMIN`           |

> ⚠️ Local development only — never use these in production.

**Notes**
- Admin is for catalog/store management via the API (Bearer token). The web app
  has no admin UI yet.
- `cart` / `checkout` / `orders` are **CUSTOMER-only** routes — to test the
  shopping flow, register a normal customer at `/register`.

## Status

Currently building. See the roadmap for phase progress.
