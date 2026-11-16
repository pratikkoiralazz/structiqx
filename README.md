# StructiqX

StructiqX is a civil engineering project delivery workspace. It brings organization and project administration together with planning, cost, field, engineering, and client-facing views in a single web application.

The repository is a multi-phase MVP: authentication, organizations, and core project records are backed by PostgreSQL; several of the later-phase workflow screens are currently populated with illustrative sample data.

## What’s included

### Application features

- **Workspace and portfolio:** organization-aware navigation, dashboard metrics, recent projects, and activity.
- **Projects:** create, browse, search, filter, and paginate projects; open a project workspace with project details and status.
- **Project delivery views:** task register, schedule/Gantt-style milestones, team, budget, BOQ, engineering calculations, procurement, site reports, documents, approvals, client portal, analytics, PDF exports, and security checks.
- **Portfolio pages:** client portal, analytics, and reports views.
- **Reporting:** print-friendly report layout that can be printed or saved to PDF using the browser.
- **Accounts:** sign in, register an organization, and switch between organizations you belong to.
## Technology stack

| Layer | Technologies |
| --- | --- |
| Web client | React 18, TypeScript, Vite |
| UI and styling | Tailwind CSS, Radix UI dialog primitive, Lucide icons, custom shadcn-style components |
| Routing and data fetching | React Router, TanStack Query |
| Forms and validation | React Hook Form, Zod, `@hookform/resolvers` |
| Charts | Recharts |
| API | Node.js, Express 4, TypeScript |
| Database and ORM | PostgreSQL, Prisma 6 |
| Authentication and security middleware | JWT, hashed refresh-token storage, bcryptjs, Helmet, CORS, express-rate-limit |
| Monorepo tooling | npm workspaces, concurrently |

## Architecture

```text
Browser (React / Vite :5173)
        │  /api requests (Vite development proxy)
        ▼
Express API (:4000)
        │  Prisma Client
        ▼
PostgreSQL
```

The root npm workspace contains two packages:

- `client/` — React single-page application and UI.
- `server/` — Express API, authentication, authorization, and Prisma integration.
- `server/prisma/` — database schema, migrations, and development seed.

The API uses short-lived bearer access tokens and an HTTP-only refresh cookie. Organization-scoped requests use the `x-organization-id` header, and the server checks the signed-in user’s organization membership and role.

## Requirements

- Node.js 20.14 or newer in the Node 20 line
- npm 10 or newer
- PostgreSQL 14 or newer

## Local setup

Run these commands from the repository root in PowerShell:

```powershell
npm install
Copy-Item server\.env.example server\.env
```

Edit `server\.env` and set:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development` for local work |
| `PORT` | API port; defaults to `4000` |
| `CLIENT_ORIGIN` | Client origin; defaults to `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Random access-token signing secret, at least 32 characters |
| `JWT_REFRESH_SECRET` | Different random refresh-token signing secret, at least 32 characters |

Create the `structiqx` database (or update `DATABASE_URL` to use an existing development database), then generate the Prisma client, apply migrations, seed sample data, and start both apps:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The client is available at <http://localhost:5173> and the API at <http://localhost:4000>. The client development server proxies `/api` requests to Express.

The development seed creates a sample organization and project portfolio. Sign in with:

- **Email:** `demo@structiqx.dev`
- **Password:** `StructiqxDemo2025!`

These credentials are for local development only. The seed script refuses to run unless `NODE_ENV` is `development` or `test`; never use the demo account or its password in a deployed environment.

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the client and API in watch/development mode |
| `npm run build` | Type-check and build the server and client |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:deploy` | Apply checked-in migrations in a deployment environment |
| `npm run db:push` | Push the Prisma schema directly (best for disposable databases without migration history) |
| `npm run db:seed` | Insert or update development demo data |

The client package also provides `npm run lint -w client`, which runs its TypeScript project checks. There is no dedicated automated test suite configured yet.

## API overview

The API is served under `/api`. The main routes include:

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/register` | Register a user and organization |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/refresh` | Rotate the refresh session |
| `POST` | `/api/auth/logout` | Revoke the refresh session |
| `GET` | `/api/auth/me` | Get the current user |
| `GET` / `POST` | `/api/organizations` | List or create organizations |
| `GET` | `/api/dashboard` | Organization dashboard metrics and activity |
| `GET` / `POST` | `/api/projects` | List or create organization projects |
| `GET` / `PATCH` / `DELETE` | `/api/projects/:id` | Read, update, or archive a project |

Protected routes require an `Authorization: Bearer <access-token>` header. Organization-scoped routes also require `x-organization-id` with an organization UUID the user belongs to.


## Deployment notes

For a deployment, provide a managed PostgreSQL database and production environment variables. Set `NODE_ENV=production`, use unique high-entropy JWT secrets, set `CLIENT_ORIGIN` to the exact HTTPS client origin, and serve the app behind HTTPS. Run `npm run db:deploy` to apply checked-in migrations. Do not run `npm run db:seed` in production.

Before exposing the app to real users or project data, review authentication and authorization, configure backups and monitoring, and implement production-grade persistence and access policies for all project workflows.
