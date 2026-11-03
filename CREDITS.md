# Credits

Abi Vault's look builds on other people's work. Thank you to all of them.

## Inspiration

- **[Jame Gam](https://jamegam.hackclub.com/)** by Hack Club is the original
  inspiration for the pixel and handwriting feel.
- **[ripple](https://github.com/0xQuerencia/ripple)** by Ricky Parmar
  (MIT License) is the project whose style we followed most closely: the pixel
  headings, the soft haze background, the annotations and the hand-drawn arrow.
  ripple is itself inspired by Jame Gam.

## Assets

| Asset | Where | Source |
| --- | --- | --- |
| Augie Pixel font | `public/fonts/augiepixel.ttf` | Created by Augie Ruben, taken from the [ripple repository](https://github.com/0xQuerencia/ripple/blob/main/src/assets/fonts/augiepixel.ttf). Check the terms there before redistributing it elsewhere. |
| Curly arrow sprite | `public/art/arrow-curl.png` | Pixel sprite from ripple, rendered from [Phosphor Icons](https://phosphoricons.com/) (MIT License) |

## Libraries

- [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- [Base UI](https://base-ui.com/) for accessible dialogs and menus
- [Recharts](https://recharts.org/) for charts
- [Lucide](https://lucide.dev/) for icons
- [Supabase](https://supabase.com/) and [Clerk](https://clerk.com/) for the
  database-backed setup
- [shadcn/ui](https://ui.shadcn.com/) for component scaffolding
- Lint rules under `tools/oxlint/anti-slop/` include a vendored copy of
  [ESLint Stylistic](https://eslint.style/) (MIT License); its license is kept
  in `tools/oxlint/anti-slop/vendor/eslint-stylistic/LICENSE`

## License

Abi Vault itself is under the [MIT License](LICENSE). The assets and libraries
above keep their own licenses.
