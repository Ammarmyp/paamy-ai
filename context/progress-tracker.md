# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Authentication (Clerk) — complete

## Current Goal

- Auth from `context/feature-specs/03-auth.md` is in place; ready for the next feature unit.

## Completed

- `context/feature-specs/01-design-system.md` — shadcn/ui configured; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added; lucide-react installed; `src/lib/utils.ts` `cn()` helper; dark theme tokens in `globals.css` (no light palette); generated `src/components/ui/*` left unmodified after install
- `context/feature-specs/02-editor.md`
  - `src/components/editor/editor-navbar.tsx` — fixed-height top navbar (left / center / right); `PanelLeftOpen` / `PanelLeftClose` from sidebar state; dark bg + subtle bottom border
  - `src/components/editor/project-sidebar.tsx` — floating overlay (does not push canvas); slides in from left; `isOpen` prop; Projects header + close; Tabs (My Projects / Shared) with empty placeholders; full-width New Project + `Plus`
  - `src/components/editor/editor-dialog.tsx` — dialog pattern with title / description / footer actions using `globals.css` tokens; no feature dialogs yet
- `context/feature-specs/03-auth.md`
  - `@clerk/ui` installed; `ClerkProvider` in root layout with Clerk `dark` theme + CSS variable appearance overrides (`src/lib/clerk-appearance.ts`)
  - `src/proxy.ts` — protected-first `clerkMiddleware`; public routes from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
  - Sign-in / sign-up catch-all pages with two-panel `AuthShell` (form-only on small screens)
  - `/` redirects authenticated users to `/editor`, unauthenticated to `/sign-in`
  - `UserButton` in editor navbar right section; minimal `/editor` route wiring chrome
  - `pnpm run build` passes

## In Progress

- None

## Next Up

- Canvas / project workspace features beyond editor chrome + auth

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- shadcn preset: `base-nova` (Radix via `@base-ui/react`), CSS variables, lucide icons
- Dark-only: project tokens from `ui-context.md` live in `:root`; shadcn semantic vars map onto them; `html` has `class="dark"` for `dark:` variants
- Editor sidebars float as overlays (translate in/out); they must not push canvas layout
- Auth: protected-first via `src/proxy.ts` (`clerkMiddleware`); public routes from Clerk sign-in/sign-up env vars; Clerk `dark` theme with monochromatic CSS-variable appearance (no hardcoded colors)
- Auth layout: 50/50 on large screens; left panel uses brand → headline → supporting → features hierarchy; right panel uses token-based grid/map backdrop + bordered form card with Sign In / Sign Up tabs

## Session Notes

- Do not edit generated `src/components/ui/*` — they import `cn` from the `cn` package; app code should use `@/lib/utils`
- With `src/app`, Next.js expects `proxy.ts` beside `app` (`src/proxy.ts`), not repo-root `middleware.ts`
