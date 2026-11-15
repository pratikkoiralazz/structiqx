# StructiqX

StructiqX is a civil engineering project workspace. Phase 1 includes an organization-aware dashboard, project listing and creation, authentication scaffolding, and a PostgreSQL/Prisma-backed Express API.

## Prerequisites

- Node.js 20.14 or newer in the Node 20 line
- npm 10+
- PostgreSQL 14+ (local or hosted)

## Local development

From the repository root in PowerShell:

```powershell
npm install
Copy-Item server\.env.example server\.env
```

Set `DATABASE_URL` in `server\.env` for a PostgreSQL database named `structiqx`. Replace both JWT secrets with different random values of at least 32 characters. Then run:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`db:migrate` creates and applies a Prisma migration for local development. Use `npm run db:push` only for disposable databases where migration history is not needed. The client runs at <http://localhost:5173> and the API at <http://localhost:4000>. The Vite development server proxies `/api` requests to Express.

The development-only seed account is `demo@structiqx.dev` / `StructiqxDemo2025!`. The seed script refuses to run unless `NODE_ENV` is `development` or `test`; do not use the development credentials outside local development.

## Workspace layout

- `client/` — React, TypeScript, Vite, Tailwind, shadcn-style UI primitives, routing, and API-backed feature screens.
- `server/` — Express API, authentication and organization authorization, request validation, and Prisma integration.
- `server/prisma/` — PostgreSQL schema and development-only seed data.

Production deployments must provide their own PostgreSQL database, long random secrets, HTTPS, and an explicit `CLIENT_ORIGIN`. Apply checked-in migration history with `npm run db:deploy` during deployment; do not run the development seed in production.
