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

## Status

Currently building. See the roadmap for phase progress.
