# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Canvas ergonomics (`17-canvas-ergonomics`) — complete

## Current Goal

- Floating zoom / undo-redo controls with keyboard shortcuts. Next: persistence and AI chat.

## Completed

- `context/feature-specs/01-design-system.md` — shadcn/ui configured; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added; lucide-react installed; `src/lib/utils.ts` `cn()` helper; dark theme tokens in `globals.css` (no light palette); generated `src/components/ui/*` left unmodified after install
- `context/feature-specs/02-editor.md`
  - `src/components/editor/editor-navbar.tsx` — fixed-height top navbar (left / center / right); `PanelLeftOpen` / `PanelLeftClose` from sidebar state; dark bg + subtle bottom border
  - `src/components/editor/project-sidebar.tsx` — floating overlay (does not push canvas); slides in from left; `isOpen` prop; Projects header + close; Tabs (My Projects / Shared) with owned and shared project lists; full-width New Project + `Plus`
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
  - Create / Rename / Delete dialogs via existing `EditorDialog` pattern (live room ID preview, rename autofocus + Enter, destructive delete confirm)
  - Sidebar rename/delete actions on owned items only; sidebar New Project opens Create
  - Mobile sidebar backdrop scrim closes on outside tap (`md:hidden`)
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
- `context/feature-specs/05-project-api.md`
  - `GET /api/projects` — lists current user’s projects with `page`/`limit` pagination and total count
  - `POST /api/projects` — creates project; Clerk `ownerId`; missing name defaults to `Untitled Project`; schema UUID id by default; optional client `id` for room-aligned create
  - `PATCH /api/projects/[projectId]` — rename; owner-only (`403` for non-owner)
  - `DELETE /api/projects/[projectId]` — delete; owner-only (`403` for non-owner)
  - Unauthenticated requests return `401` via `src/lib/api-auth.ts`
  - Shared helpers in `src/lib/projects.ts`
- `context/feature-specs/05-wire-editor-home.md`
  - `/editor` layout is a server component: loads owned + shared projects via `loadEditorProjectLists` and passes them into `EditorShell` / sidebar (no client fetch for initial load)
  - `src/hooks/use-project-actions.ts` — dialog state, name input, create room ID (`slugify(name)` + short suffix), `POST` / `PATCH` / `DELETE` mutations; create navigates to `/editor/[projectId]`; rename refreshes; delete redirects to `/editor` when active workspace is removed, otherwise refreshes
  - Create dialog shows room ID preview; rename pre-fills name; delete shows project name
  - Project id and Liveblocks room id stay aligned (create sends room id as project `id`)
  - Mock project list / `use-project-dialogs` removed
- Editor home follow-ups: empty-slug room ID fallback (`project-{suffix}`); mutation errors surfaced in `EditorDialog`; sidebar project names link to `/editor/[projectId]`
- `context/feature-specs/08-editor-workspace-shell.md`
  - `/editor/[roomId]` server page: unauthenticated → `/sign-in`; missing/unauthorized → `AccessDenied`
  - `src/components/editor/access-denied.tsx` — centered lock icon, message, link back to `/editor`
  - `src/lib/project-access.ts` — `getClerkIdentity`, `userHasProjectAccess`, `getAccessibleProject` (owner or collaborator by email)
  - Editor layout uses `getClerkIdentity` for sidebar project lists
  - Workspace chrome: navbar project name + share + AI sidebar toggle; `ProjectSidebar` highlights `activeRoomId`; canvas placeholder; right AI sidebar placeholder (no Liveblocks / chat / share behavior yet)
  - `pnpm run build` passes
- `context/feature-specs/09-share-dialog.md`
  - Navbar Share opens `ShareProjectDialog` on the active workspace
  - `GET` / `POST` / `DELETE` `/api/projects/[projectId]/collaborators` — list for members; invite/remove owner-only (`403` otherwise)
  - `src/lib/collaborators.ts` + `src/lib/clerk-users.ts` — DB helpers; Clerk Backend enrichment for name/avatar with email-only fallback (no local user table)
  - Owners: invite by email, list, remove, copy project link with temporary `Copied!` feedback
  - Collaborators: read-only collaborator list
  - `pnpm run build` passes
- `context/feature-specs/10-liveblocks-setup.md`
  - `liveblocks.config.ts` — Presence (`cursor`, `isThinking`) and UserMeta (`id`, `name`, `avatar`, `color`)
  - `src/lib/liveblocks.ts` — cached `@liveblocks/node` client; `getCursorColor` maps user ID → fixed palette
  - `POST /api/liveblocks-auth` — Clerk auth, `userHasProjectAccess` (project ID = room ID), `getOrCreateRoom`, session token with name/avatar/color; `403` when unauthorized
  - `@liveblocks/node` added (server SDK for auth client)
  - `pnpm run build` passes
- `context/feature-specs/11-base-canvas.md`
  - `/editor/[roomId]` stays a server page; `EditorWorkspace` mounts the client canvas stack
  - `src/components/editor/canvas-room.tsx` — `LiveblocksProvider` (`/api/liveblocks-auth`), `RoomProvider` (room ID + `cursor: null` presence), `ClientSideSuspense`, connection error fallback
  - `src/components/editor/collaborative-canvas.tsx` — `useLiveblocksFlow` (suspense, empty nodes/edges) → `ReactFlow` with loose connections, `fitView`, `MiniMap`, dot `Background`
  - `src/types/canvas.ts` — `CanvasNodeData` (label/color/shape), `canvasNode` / `canvasEdge` types, `NODE_COLORS`, `NODE_SHAPES`
  - No controls, custom node/edge renderers, persistence, or AI yet
  - `pnpm run build` passes
- `context/feature-specs/12-shape-panel.md`
  - `src/components/editor/shape-panel.tsx` — floating bottom-center pill toolbar; draggable icons for rectangle, diamond, circle, pill, cylinder, hexagon
  - Drag payload (`SHAPE_DRAG_MIME`) includes shape + default size (`SHAPE_DEFAULT_SIZES` in `types/canvas.ts`)
  - Canvas wrapper `dragover` / `drop` → `screenToFlowPosition` → `onNodesChange` add with empty label, default color, dragged shape
  - Node IDs: `{shape}-{timestamp}-{counter}`
  - `src/components/editor/canvas-node.tsx` — basic bordered rectangle renderer for `canvasNode` (shape-specific visuals later)
  - `pnpm run build` passes
- `context/feature-specs/13-node-shape.md`
  - `src/components/editor/node-shape-visual.tsx` — shared renderer: CSS for rectangle/pill/circle; SVG for diamond/hexagon/cylinder (scales with node size); subtle border at rest, brighter when selected
  - `src/components/editor/canvas-node.tsx` — uses `NodeShapeVisual` with Liveblocks/React Flow node data + selection
  - `src/components/editor/shape-panel.tsx` — ghost drag preview follows cursor at default size; clears on drop/cancel; drop creation unchanged
  - `pnpm run build` passes
- `context/feature-specs/14-node-editing.md`
  - `src/components/editor/canvas-node.tsx` — `NodeResizer` on selected nodes (min 48×48, dark subtle handles/lines); double-click label opens centered textarea; empty-state placeholder; live `updateNodeData` as user types; blur / Escape closes; `nodrag` / `nopan` while editing
  - Shape rendering, shape panel, and drop creation left unchanged
  - Follow-up: four-side white connection handles (hover/selected); curved bezier edges with arrow via `defaultEdgeOptions`; brighter selected border (`--text-primary`)
  - `pnpm run build` passes
- `context/feature-specs/15-nodes-color-toolbar.md`
  - `src/components/editor/node-color-toolbar.tsx` — floating toolbar above selected nodes; one swatch per `NODE_COLORS` pair; active ring; hover glow from paired text color; `nodrag` / `nopan`
  - `src/components/editor/canvas-node.tsx` — shows toolbar when selected; swatch sets `data.color` via `updateNodeData` (fill + paired text via palette lookup)
  - Reused existing `NODE_COLORS` in `types/canvas.ts`; no server calls
  - `CanvasEdge` typed as `"default"` to match bezier `defaultEdgeOptions` (fixes prior type error)
  - `pnpm run build` passes
- `context/feature-specs/16-edge-behavior.md`
  - Four-side connection handles on nodes: small white dots with dark border; hidden until node hover (also visible when selected)
  - `src/components/editor/canvas-edge.tsx` — custom `canvasEdge` renderer: smooth-step right-angle path, dimmed at rest, brightens on hover/selection, wide invisible hit target, closed arrow via `defaultEdgeOptions`
  - Inline edge labels via `EdgeLabelRenderer` + `getSmoothStepPath` midpoint; growing input; save on blur / Enter / Escape; pill badges; faint “Add label” hint on active unlabeled edges; `nodrag` / `nopan`; `updateEdgeData` for collaborative sync
  - `CanvasEdge` / `CanvasEdgeData` types; new connections default to `canvasEdge`
  - `pnpm run build` passes
- `context/feature-specs/17-canvas-ergonomics.md`
  - `src/components/editor/canvas-controls.tsx` — bottom-left pill bar: zoom out / fit view / zoom in + undo / redo (divider between groups); React Flow zoom with short animation; Liveblocks `useUndo` / `useRedo` / `useCanUndo` / `useCanRedo`; disabled history buttons dimmed
  - `src/hooks/useKeyboardShortcuts.ts` — window listeners for `+`/`=` zoom in, `-` zoom out, Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z and Cmd/Ctrl+Y redo; skips inputs / textareas / contenteditable
  - MiniMap removed from collaborative canvas
  - `pnpm run build` passes

## In Progress

- None

## Next Up

- Persistence and AI chat

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- shadcn preset: `base-nova` (Radix via `@base-ui/react`), CSS variables, lucide icons
- Dark-only: project tokens from `ui-context.md` live in `:root`; shadcn semantic vars map onto them; `html` has `class="dark"` for `dark:` variants
- Editor sidebars float as overlays (translate in/out); they must not push canvas layout
- Auth: protected-first via `src/proxy.ts` (`clerkMiddleware`); public routes from Clerk sign-in/sign-up env vars; Clerk `dark` theme with monochromatic CSS-variable appearance (no hardcoded colors)
- Auth layout: 50/50 on large screens; left panel uses brand → headline → supporting → features hierarchy; right panel uses token-based grid/map backdrop + bordered form card with Sign In / Sign Up tabs
- Editor home lists are server-fetched; mutations go through `/api/projects` and `router.refresh()` / navigation — no client cache library for this flow
- Project create may supply a slug+suffix `id` so the project id doubles as the Liveblocks room id
- Prisma 8 (not Prisma 7 `@prisma/client` / Accelerate): models live in `src/prisma/contract.prisma`; runtime is `src/prisma/db.ts`; app code imports the cached instance from `src/lib/prisma.ts`
- First schema change uses `migration plan` + `db migrate`, not `db update`
- Liveblocks auth uses access-token sessions (`prepareSession`); room ID equals project ID; rooms are created on demand via `getOrCreateRoom`
- Canvas shape creation uses HTML5 drag-and-drop into the React Flow wrapper; new nodes are added via Liveblocks `onNodesChange` `{ type: "add" }` so they sync across clients

## Session Notes

- Do not edit generated `src/components/ui/*` — they import `cn` from the `cn` package; app code should use `@/lib/utils`
- With `src/app`, Next.js expects `proxy.ts` beside `app` (`src/proxy.ts`), not repo-root `middleware.ts`
- Do not edit emitted `src/prisma/contract.json` / `contract.d.ts`; edit `contract.prisma` then `pnpm prisma contract emit`
- Prisma 8 `db.ts` is a process-lifetime singleton; `db.close()` is for scripts, not request handlers
- Liveblocks requires `LIVEBLOCKS_SECRET_KEY` in `.env` for `/api/liveblocks-auth`
