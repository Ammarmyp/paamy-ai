## Update the entire applications UI UX

I would like you to read ui-contxt.md file and update it according to the following.

### what to use
- use the tweakcn command to update the global theme of the appliation. the command you need to run at the root of the application is pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/cmurc89pw000004js6cl538w3


### Add theme toggling for the app

- installe next themes using pnpm add next-theme
- create a `theme-provider.tsx` and set up the theme provider
- Wrap the root layout with the provider.
- Add a mode toggler for three states ( dark, light or system.)
- The toggle should be a dropdowm icon menu that is a clean decoupled component that is reusable anywhere. for now let it sit on the top global navbar on the right side along with the rest of the action buttons.

### check when done

- new components compile without Typescript errors
- no lint errors
- theme toggling is ready for future use