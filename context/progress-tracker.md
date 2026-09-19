# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Prisma project data models — complete

## Current Goal

- Auth, editor chrome, project dialogs, and Prisma 8 `Project` / `ProjectCollaborator` persistence are in place. Next: canvas / project workspace features.

## Completed

- `context/feature-specs/01-design-system.md` — shadcn/ui configured; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added; lucide-react installed; `src/lib/utils.ts` `cn()` helper; dark theme tokens in `globals.css` (no light palette); generated `src/components/ui/*` left unmodified after install
- `context/feature-specs/02-editor.md`
  - `src/components/editor/editor-navbar.tsx` — fixed-height top navbar (left / center / right); `PanelLeftOpen` / `PanelLeftClose` from sidebar state; dark bg + subtle bottom border
  - `src/components/editor/project-sidebar.tsx` — floating overlay (does not push canvas); slides in from left; `isOpen` prop; Projects header + close; Tabs (My Projects / Shared) with mock owned and shared project lists; full-width New Project + `Plus`
  - `src/components/editor/editor-dialog.tsx` — dialog pattern with title / description / footer actions using `globals.css` tokens; no feature dialogs yet
- `context/feature-specs/03-auth.md`
  - `@clerk/ui` installed; `ClerkProvider` in root layout with Clerk `dark` theme + CSS variable appearance overrides (`src/lib/clerk-appearance.ts`)
  - `src/proxy.ts` — protected-first `clerkMiddleware`; public routes from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
  - Sign-in / sign-up catch-all pages with two-panel `AuthShell` (form-only on small screens)
  - `/` redirects authenticated users to `/editor`, unauthenticated to `/sign-in`
  - `UserButton` in editor navbar right section; minimal `/editor` route wiring chrome
  - `pnpm run build` passes
- `context/feature-specs/04-project-dialogs.md`
  - `/editor` home: heading, description, `New Project` + `Plus` (no cards); opens Create dialog
  - `src/hooks/use-project-dialogs.ts` — dialog, form, and loading state; in-memory mock list only
  - Create / Rename / Delete dialogs via existing `EditorDialog` pattern (live slug preview, rename autofocus + Enter, destructive delete confirm)
  - Sidebar lists mock owned/shared projects; rename/delete actions on owned items only; sidebar New Project opens Create
  - Mobile sidebar backdrop scrim closes on outside tap (`md:hidden`)
  - `pnpm exec tsc --noEmit` and `pnpm lint` pass
- Prisma 8 ORM init (Postgres) after a failed `pnpm add` during `orm init`
  - Installed `@prisma/orm-postgres`, `dotenv`, `prisma@8.0.0-rc.15`, `@prisma/cli-engine`
  - Contract path in `prisma.config.ts` is `./src/prisma/contract.prisma`
  - `pnpm prisma contract emit` writes `src/prisma/contract.json` and `src/prisma/contract.d.ts`
- `context/feature-specs/05-prisma.md` — rewritten from Prisma 7 (`schema.prisma` / Accelerate / `@prisma/adapter-pg`) to the Prisma 8 contract, `postgres()` singleton, and `migration plan` / `db migrate` flow
  - Replaced starter `User`/`Post` with `Project` and `ProjectCollaborator` in `src/prisma/contract.prisma` (Prisma 8 contract; not Prisma 7 `prisma/models/`)
  - `Project`: Clerk `ownerId`, name, optional description, `ProjectStatus` (`DRAFT` | `ARCHIVED`, default `DRAFT`), optional `canvasJsonPath`, timestamps; indexes on `ownerId` and `createdAt`
  - `ProjectCollaborator`: project FK with `onDelete: Cascade`, email, `createdAt`; unique `(projectId, email)`; indexes on email and `(projectId, createdAt)`
  - Cached singleton in `src/prisma/db.ts` (`postgres()` factory, `globalThis` cache in development); `src/lib/prisma.ts` re-exports it as `prisma`
  - First migration `migrations/app/20260918T1128_init_projects` planned and applied; `db` ref advanced
  - `prebuild` runs `prisma contract emit`; `pnpm run build` passes

## In Progress

- None

## Next Up

- Canvas / project workspace features beyond editor chrome, auth, project dialogs, and Prisma models

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- shadcn preset: `base-nova` (Radix via `@base-ui/react`), CSS variables, lucide icons
- Dark-only: project tokens from `ui-context.md` live in `:root`; shadcn semantic vars map onto them; `html` has `class="dark"` for `dark:` variants
- Editor sidebars float as overlays (translate in/out); they must not push canvas layout
- Auth: protected-first via `src/proxy.ts` (`clerkMiddleware`); public routes from Clerk sign-in/sign-up env vars; Clerk `dark` theme with monochromatic CSS-variable appearance (no hardcoded colors)
- Auth layout: 50/50 on large screens; left panel uses brand → headline → supporting → features hierarchy; right panel uses token-based grid/map backdrop + bordered form card with Sign In / Sign Up tabs
- Project create/rename/delete are UI-only against in-memory mock data; no API or persistence yet
- Prisma 8 (not Prisma 7 `@prisma/client` / Accelerate): models live in `src/prisma/contract.prisma`; runtime is `src/prisma/db.ts`; app code imports the cached instance from `src/lib/prisma.ts`
- First schema change uses `migration plan` + `db migrate`, not `db update`

## Session Notes

- Do not edit generated `src/components/ui/*` — they import `cn` from the `cn` package; app code should use `@/lib/utils`
- With `src/app`, Next.js expects `proxy.ts` beside `app` (`src/proxy.ts`), not repo-root `middleware.ts`
- Do not edit emitted `src/prisma/contract.json` / `contract.d.ts`; edit `contract.prisma` then `pnpm prisma contract emit`
- Prisma 8 `db.ts` is a process-lifetime singleton; `db.close()` is for scripts, not request handlers
