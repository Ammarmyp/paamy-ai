# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Design system and UI primitives

## Current Goal

- Design system foundation is in place; ready for the next feature unit.

## Completed

- `context/feature-specs/01-design-system.md` — shadcn/ui configured; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added; lucide-react installed; `src/lib/utils.ts` `cn()` helper; dark theme tokens in `globals.css` (no light palette); generated `src/components/ui/*` left unmodified after install

## In Progress

- None yet.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- shadcn preset: `base-nova` (Radix via `@base-ui/react`), CSS variables, lucide icons
- Dark-only: project tokens from `ui-context.md` live in `:root`; shadcn semantic vars map onto them; `html` has `class="dark"` for `dark:` variants

## Session Notes

- Do not edit generated `src/components/ui/*` — they import `cn` from the `cn` package; app code should use `@/lib/utils`
