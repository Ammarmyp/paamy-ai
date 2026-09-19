Prisma 8 is already installed (`@prisma/orm-postgres`, `prisma.config.ts`, `src/prisma/`). Add the project data models, cached runtime singleton, and first migration.

This is Prisma 8 (contract-first). Do not use Prisma 7 surfaces: `schema.prisma`, `@prisma/client`, `PrismaClient`, Accelerate, or `@prisma/adapter-pg`.

## Models

Author models in `src/prisma/contract.prisma` (the contract source named by `prisma.config.ts`). Do not create `prisma/models/` or a Prisma 7 `schema.prisma`.

The first line of the contract must be `// use prisma-8`.

Add enum `ProjectStatus`:

- `@@type("pg/text@1")`
- members `DRAFT = "DRAFT"`, `ARCHIVED = "ARCHIVED"`

Add `Project`:

- `id` `String @id @default(uuid())`
- `ownerId` `String` mapped to the Clerk user id
- `name` `String`
- optional `description`
- `status` `ProjectStatus @default(DRAFT)`
- optional `canvasJsonPath` for future canvas blob storage
- `createdAt` `TimestamptzString @default(now())`
- `updatedAt` `temporal.updatedAtString()`
- indexes on `ownerId` and `createdAt`

Add `ProjectCollaborator`:

- `id` `String @id @default(uuid())`
- `project` relation on `projectId` with `onDelete: Cascade` (owning side only; Prisma 8 derives the back-reference)
- collaborator `email`
- `createdAt` `TimestamptzString @default(now())`
- unique constraint on `[projectId, email]`
- indexes on `email` and `[projectId, createdAt]`

Use `TimestamptzString` (not Temporal columns) so Node does not need a Temporal polyfill.

Do not add extra fields unless required by Prisma. Remove the starter `User` / `Post` models.

After editing the contract, run `pnpm prisma contract emit`. Do not hand-edit `contract.json` or `contract.d.ts`.

## Prisma Client

Runtime entry is `src/prisma/db.ts`.

Construct one `postgres<Contract>({ contractJson, url })` client from `@prisma/orm-postgres/runtime`. Import `Contract` from `./contract.d` and `contract.json` with `{ type: "json" }`.

Pass `process.env["DATABASE_URL"]` as `url`. Do not branch on Accelerate vs `@prisma/adapter-pg`.

Cache the client on `globalThis` in development so Next.js hot reloads do not open extra pools. Do not call `db.close()` from request handlers.

Re-export that singleton from `src/lib/prisma.ts` as `prisma`. App code imports `{ prisma } from "@/lib/prisma"`.

## Migration

Formal path (replayable history), not `db update`:

1. `pnpm prisma contract emit`
2. `pnpm prisma migration plan --name init_projects`
3. `pnpm prisma db migrate --advance-ref db`

Leave framework-rendered `migrations/app/<dir>/migration.ts` as generated unless it contains `placeholder(...)`.

## Dependencies

Already installed:

- `prisma`
- `@prisma/orm-postgres`
- `@prisma/cli-engine`
- `dotenv`

Next.js has no Prisma emit plugin. `package.json` `prebuild` runs `prisma contract emit`.

## Check When Done

- Implementation uses Prisma 8 (`contract.prisma`, `postgres()` factory, `migration plan` / `db migrate`) — not Prisma 7 client/Accelerate/adapter-pg
- Contract has both models with correct relations and indexes
- `src/prisma/db.ts` is one cached runtime singleton; `src/lib/prisma.ts` re-exports it as `prisma`
- Migration runs successfully
- `pnpm run build` passes
