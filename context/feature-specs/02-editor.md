We need the base chrome component that frame every editor screen - the top navbar and the left sidebar shell. These will be reused and extended in every chapter that follows.

### Editor Navbar

Create `components/editor/editor-navbar.tsx`.

Requirements:

- fixed-height top navabar
- left, center and right sections
- use  `panelLeftOpen` / `PanelLeftClose` icons based on sidebar state
- right section stays empty for now
- dark background with subtle bottom border

### Project sidebar

Create `components/editor/project-sidebar.tsx`.

Requirements:

- sidebar should float above the editor canvas
- opening it should not push the page content
- slides in from the left
- accepts `isOpen` prop
- header with  `Projects` title + close button
- shadcn `Tabs`:
    - My Projects
    - Shared
-both tabs show  empty placeholder state
- full-width `New Project` button at the bottom with `Plus` icon

### Dialog Pattern

Use the existing color tokens from `global.css` fro dialog styling.

Support:

- title
- description
- footer actions

Do not build actual dialogs yet.

### check when done

- new components compile without Typescript errors
- no lint errors
- dialog pattern is ready for future use