# UI Context

## Theme

Light and dark modes, with a system preference option. Theme class is managed by `next-themes` (`attribute="class"`) via `ThemeProvider` in the root layout. Default is `system`.

The chrome is monochromatic: foreground / background / muted surfaces only. Brand cyan and AI purple accents are removed — `--accent-primary` / `--accent-ai*` alias to text tokens for backward-compatible utilities (`text-brand`, `text-ai-text`). Colorful UI is reserved for canvas design (node color palette, collaborator cursors).

Semantic shadcn tokens live in `:root` (light) and `.dark` (dark), applied from the tweakcn theme. Project surface/text tokens mirror the active mode so utilities like `bg-surface` and `text-copy-primary` follow the toggle.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Prefer semantic tokens (`bg-background`, `text-foreground`, `bg-muted`) for new UI. No hardcoded brand hex or raw Tailwind color classes like `zinc-*` in chrome components.

### Project tokens (mode-aware)

| Role             | CSS Variable           | Light                         | Dark                          |
| ---------------- | ---------------------- | ----------------------------- | ----------------------------- |
| Page background  | `--bg-base`            | `oklch(1 0 0)`                | `#080809`                     |
| Surface          | `--bg-surface`         | `oklch(0.985 0 0)`            | `#111114`                     |
| Elevated surface | `--bg-elevated`        | `oklch(1 0 0)`                | `#18181c`                     |
| Subtle surface   | `--bg-subtle`          | `oklch(0.97 0 0)`             | `#1e1e23`                     |
| Default border   | `--border-default`     | `oklch(0.922 0 0)`            | `#2a2a30`                     |
| Subtle border    | `--border-subtle`      | `oklch(0.87 0 0)`             | `#3a3a42`                     |
| Primary text     | `--text-primary`       | `oklch(0.145 0 0)`            | `#f0f0f4`                     |
| Secondary text   | `--text-secondary`     | `oklch(0.371 0 0)`            | `#c0c0cc`                     |
| Muted text       | `--text-muted`         | `oklch(0.556 0 0)`            | `#808090`                     |
| Faint text       | `--text-faint`         | `oklch(0.708 0 0)`            | `#505060`                     |
| Brand / AI (mono)| `--accent-primary` etc | aliases of text tokens        | same                          |
| Neutral node     | `--node-neutral-*`     | light surface / dark text     | `#1f1f1f` / `#ededed`         |
| Canvas edge      | `--canvas-edge`        | mid gray                      | `#f8fafc`                     |
| Error            | `--state-error`        | `#ff4d4f`                     | same                          |
| Success          | `--state-success`      | `#34d399`                     | same                          |
| Warning          | `--state-warning`      | `#fbbf24`                     | same                          |

Tailwind utility names map to these variables. Use `bg-base`, `bg-surface`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `bg-foreground`, `text-background`, etc.

### Theme toggle

Reusable `ModeToggle` (`src/components/mode-toggle.tsx`) — dropdown icon menu with Light / Dark / System. Mounted on the editor navbar right actions for now; safe to reuse anywhere under `ThemeProvider`.

## Typography

| Role      | Font       | CSS Variable        |
| --------- | ---------- | ------------------- |
| UI text   | Geist Sans | `--font-geist-sans` |
| Code/mono | Geist Mono | `--font-geist-mono` |

Both fonts are loaded via `next/font/google` and applied as CSS variables on the `<html>` element. The base `body` uses Geist Sans with `antialiased`.

## Border Radius

Radius increases with surface depth — smaller for inner elements, larger for outer containers. Base `--radius` comes from the active theme (currently `0.225rem`).

| Context           | Class         |
| ----------------- | ------------- |
| Inline / small UI | `rounded-xl`  |
| Cards / panels    | `rounded-2xl` |
| Modal / overlay   | `rounded-3xl` |

## Canvas

### Node Color Palette

8 defined color pairs in `types/canvas.ts` as `NODE_COLORS`. The default/neutral entry (`#1F1F1F` storage key) paints via `--node-neutral-fill` / `--node-neutral-text` so it follows light/dark. The other seven are fixed vivid design colors the user can apply — they do not change with theme.

| Node fill (stored) | Text color | Character              |
| ------------------ | ---------- | ---------------------- |
| `#1F1F1F` (neutral)| theme CSS  | Default / neutral      |
| `#10233D`          | `#52A8FF`  | Blue                   |
| `#2E1938`          | `#BF7AF0`  | Purple                 |
| `#331B00`          | `#FF990A`  | Orange                 |
| `#3C1618`          | `#FF6166`  | Red                    |
| `#3A1726`          | `#F75F8F`  | Pink                   |
| `#0F2E18`          | `#62C073`  | Green                  |
| `#062822`          | `#0AC7B4`  | Teal                   |

Use `resolveNodePaint(fill)` when rendering. Default stored color: `#1F1F1F`.

### Edge Style

Smooth-step path with an arrow marker. Stroke uses `--canvas-edge` (theme-aware). Stroke width is thin — edges are visually secondary to nodes.

### Node Shapes

6 supported shapes, defined in `types/canvas.ts` as `NODE_SHAPES`. Complex shapes (diamond, hexagon, cylinder) are rendered as inline SVGs rather than CSS borders.

- `rectangle` — default general-purpose node
- `diamond` — decision / gateway
- `circle` — event / endpoint
- `pill` — service / process
- `cylinder` — database / storage
- `hexagon` — external system / boundary

### Connection Handles

Small circular handles using `bg-foreground` / `border-background`, hidden by default, revealed on node hover. Appear at all four sides of a node.

### Canvas Background

React Flow `<Background>` component. Canvas sits on `bg-base`; dots use `--border-default`.

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch.

## Layout Patterns

- Editor workspace: full-viewport layout — floating sidebar overlay on the left, center canvas, slide-over AI sidebar on the right.
- Sidebars (projects + AI): floating overlay with mode-aware surface background and subtle border; AI workspace uses the same monochrome tokens (foreground send/user bubbles, muted empty states) — no green or purple accents.
- Modals and dialogs: centered overlay, `rounded-3xl`, mode-aware background with backdrop blur.
- Navbar: top bar with mode-aware background and bottom border; theme toggle sits with right-side actions.

## Icons

Lucide React. Stroke-based icons only — no filled variants. Icon sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-8 w-8` for feature icons in empty states.
