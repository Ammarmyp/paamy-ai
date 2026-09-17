# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Editor chrome (navbar + project sidebar)

## Current Goal

- Editor chrome foundation from `context/feature-specs/02-editor.md` is in place; ready for the next feature unit.

## Completed

- `context/feature-specs/01-design-system.md` — shadcn/ui configured; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added; lucide-react installed; `src/lib/utils.ts` `cn()` helper; dark theme tokens in `globals.css` (no light palette); generated `src/components/ui/*` left unmodified after install
- `context/feature-specs/02-editor.md`
  - `src/components/editor/editor-navbar.tsx` — fixed-height top navbar (left / center / right); `PanelLeftOpen` / `PanelLeftClose` from sidebar state; empty right section; dark bg + subtle bottom border
  - `src/components/editor/project-sidebar.tsx` — floating overlay (does not push canvas); slides in from left; `isOpen` prop; Projects header + close; Tabs (My Projects / Shared) with empty placeholders; full-width New Project + `Plus`
  - `src/components/editor/editor-dialog.tsx` — dialog pattern with title / description / footer actions using `globals.css` tokens; no feature dialogs yet

## In Progress

- None

## Next Up

- Wire editor chrome into a workspace route / layout once canvas work begins

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- shadcn preset: `base-nova` (Radix via `@base-ui/react`), CSS variables, lucide icons
- Dark-only: project tokens from `ui-context.md` live in `:root`; shadcn semantic vars map onto them; `html` has `class="dark"` for `dark:` variants
- Editor sidebars float as overlays (translate in/out); they must not push canvas layout

## Session Notes

- Do not edit generated `src/components/ui/*` — they import `cn` from the `cn` package; app code should use `@/lib/utils`
