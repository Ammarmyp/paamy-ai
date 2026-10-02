# UI Context

## Theme

Light and dark modes, with a system preference option. Theme class is managed by `next-themes` (`attribute="class"`) via `ThemeProvider` in the root layout. Default is `system`.

Semantic shadcn tokens live in `:root` (light) and `.dark` (dark), applied from the tweakcn theme (`pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/cmurc89pw000004js6cl538w3`). Project surface/text tokens mirror the active mode so utilities like `bg-surface` and `text-copy-primary` follow the toggle.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Prefer semantic tokens (`bg-background`, `text-muted-foreground`) for new UI; existing project tokens remain supported. No hardcoded hex values or raw Tailwind color classes like `zinc-*` in components.

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
| Brand accent     | `--accent-primary`     | `#00c8d4` (cyan)              | same                          |
| Brand dim        | `--accent-primary-dim` | `rgba(0, 200, 212, 0.12)`     | same                          |
| AI accent        | `--accent-ai`          | `#6457f9` (indigo-purple)     | same                          |
| AI text          | `--accent-ai-text`     | `#8b82ff`                     | same                          |
| Error            | `--state-error`        | `#ff4d4f`                     | same                          |
| Success          | `--state-success`      | `#34d399`                     | same                          |
| Warning          | `--state-warning`      | `#fbbf24`                     | same                          |

Tailwind utility names map to these variables. Use `bg-base`, `bg-surface`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.

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

8 defined color pairs. Each pair specifies a dark node fill and a vivid contrasting text color tuned for readability on the dark canvas. Defined in `types/canvas.ts` as `NODE_COLORS`.

| Node fill | Text color | Character              |
| --------- | ---------- | ---------------------- |
| `#1F1F1F` | `#EDEDED`  | Neutral dark (default) |
| `#10233D` | `#52A8FF`  | Blue                   |
| `#2E1938` | `#BF7AF0`  | Purple                 |
| `#331B00` | `#FF990A`  | Orange                 |
| `#3C1618` | `#FF6166`  | Red                    |
| `#3A1726` | `#F75F8F`  | Pink                   |
| `#0F2E18` | `#62C073`  | Green                  |
| `#062822` | `#0AC7B4`  | Teal                   |

Default node color: `#1F1F1F` with `#EDEDED` text.

### Edge Style

Smooth-step path with an arrow marker. Default edge color: `#f8fafc`. Stroke width is thin — edges are visually secondary to nodes.

### Node Shapes

6 supported shapes, defined in `types/canvas.ts` as `NODE_SHAPES`. Complex shapes (diamond, hexagon, cylinder) are rendered as inline SVGs rather than CSS borders.

- `rectangle` — default general-purpose node
- `diamond` — decision / gateway
- `circle` — event / endpoint
- `pill` — service / process
- `cylinder` — database / storage
- `hexagon` — external system / boundary

### Connection Handles

Small white circular handles, hidden by default, revealed on node hover. Appear at all four sides of a node.

### Canvas Background

React Flow `<Background>` component. Canvas sits on the base background color.

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch.

## Layout Patterns

- Editor workspace: full-viewport layout — floating sidebar overlay on the left, center canvas, slide-over AI sidebar on the right.
- Sidebars: floating overlay with mode-aware surface background and subtle border.
- Modals and dialogs: centered overlay, `rounded-3xl`, mode-aware background with backdrop blur.
- Navbar: top bar with mode-aware background and bottom border; theme toggle sits with right-side actions.

## Icons

Lucide React. Stroke-based icons only — no filled variants. Icon sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-8 w-8` for feature icons in empty states.
