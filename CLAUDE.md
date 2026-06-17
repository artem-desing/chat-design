@AGENTS.md

# Chat Background Prototype — Claude Code operating manual

## Project at a glance

Clickable Next.js prototype for exploring an animated **chat background** for
Wallarm — the ambient field that sits behind the chat surface. Sibling to the
`auth-design` and `global-navigation-prototype` prototypes — same stack and WADS
chassis, different surface. Discussion artifact, not production.

The animation is currently a **tasteful placeholder** (a gentle drifting-particle
field and a soft "aurora" of slow color blobs). The real chat-background design
requirements are pending from Artem — when they land, swap the engine's two draw
routines and retune the `--chat-bg-*` tokens. The chassis (picker → final → tune,
token-driven theming, DPR / reduced-motion / visibility handling) is built to
outlast the placeholder.

Owner: Artem Miskevich (Head of Design, `amiskevich@wallarm.com`).

## Stack

- Next.js 16 (App Router) + Turbopack
- React 19 + TypeScript strict
- Tailwind CSS v4 (tokens come from WADS — do not redefine)
- `@wallarm-org/design-system@0.29.2` (WADS) plus peers: `tw-animate-css`, `non.geist`, `@internationalized/date`
- `pnpm` only — never npm or yarn
- Deploys as a static export to GitHub Pages (`output: export`, basePath `/chat-design`)

## WADS imports

Each component from its own path. NO barrel imports:

```ts
import { Button } from '@wallarm-org/design-system/Button';
import { SegmentedControl } from '@wallarm-org/design-system/SegmentedControl';
import { Switch } from '@wallarm-org/design-system/Switch';
```

Theme is imported once in `src/app/globals.css`. Don't duplicate token imports elsewhere.
Build chrome from WADS primitives, not raw Tailwind utility classes. Stay on stable
WADS (no `-rc`) unless Artem confirms.

## WADS gotchas (carried over from the sibling prototypes — these cost real time)

- **Spacing is 1px-based.** WADS overrides Tailwind's `--spacing` to 1px, so every spacing
  utility means N **px**, not 4×N. Use `w-80` (not `w-20`), `gap-4` (not `gap-1`), `px-16` for 16px.
- **`max-w-<number>` rides the 1px spacing scale too** — `max-w-160` is **160px**, not a wide
  container, which silently crushes page layouts into a thin strip. For page/content width use the
  rem-based named scale (`max-w-2xl`, `max-w-3xl`, …), which the `--spacing` override doesn't touch.
- **Surface tokens stack invisibly in light mode.** `surface-1/2/3/4` are all white in light theme.
  For hover-on-surface use `--color-bg-light-primary` (slate-50), not another surface token.
- **Icon set has gaps.** WADS 0.29.2 ships ~189 icons but the barrel exports fewer; common ones
  (User, Sun, Bug, Eye) may be missing/unbarreled. Inline a custom SVG when one's absent.
- **`Text` defaults to `whitespace-pre-wrap`** — pass `truncate` or `style={{whiteSpace:'nowrap'}}`
  when it sits inside a nowrap parent.
- **`<button>` centers text** — add `text-left` to any button wrapping `<Text grow>`.

## Surfaces built so far

### Chat background (`src/components/chat-background/` + `src/app/chat-background/`)

Decorative animated ambient field for the chat screen — a canvas engine with two
restrained, premium-feeling variants. Placeholder motion until the design lands.

- `engine.ts` — framework-agnostic canvas engine. DPR-aware, single rAF loop,
  runtime CSS-var color resolution, `prefers-reduced-motion` freeze, visibility
  pause, robust clamped frame timing. Two variants share the loop: `particles`
  (soft drifting dots, drawn from cached per-color sprites so the field stays
  smooth) and `aurora` (a few large feathered radial-gradient blobs on slow
  Lissajous paths). `DEFAULTS` per variant.
- `chat-background.tsx` — React wrapper. Resolves prop defaults, mirrors live
  tunables via a JSON signature, re-resolves colors on theme flip via a
  `MutationObserver` on `<html>`. Renders only the field (`aria-hidden`, never in
  tab order, no pointer events).
- Colors come from **dedicated theme-aware tokens** in `globals.css`
  (`--chat-bg-base` / `-dot` / `-accent`), each defined in terms of WADS palette
  tokens so the field tracks light/dark automatically. `getComputedStyle()
  .getPropertyValue()` resolves `var()` chains to a final hex, so the engine reads
  them cleanly.

Routes (the prototype's Storybook substitute):
- `/` — picker "super page" (mirrors the sibling prototypes' "Pick a variant" hub).
- `/chat-background/final` — clean ship-ready frame: animation + empty chat panel,
  no controls, follows system theme via the shipped component defaults.
- `/chat-background/tune` — full tuning panel (variant, intensity, speed, density,
  size, glow/feather, drift) plus a light/dark preview switch. "← All prototypes"
  links back to the picker.

## Deployment

- **Live:** https://artem-desing.github.io/chat-design/ — repo `artem-desing/chat-design` (public).
- `.github/workflows/deploy-pages.yml` builds the static export and deploys on **push to `main`**
  (Pages source = GitHub Actions). The local branch is `main`; pushing redeploys.
- One-time: the repo's Pages **source must be set to GitHub Actions** (Settings → Pages) before the
  first deploy succeeds.
- Pushing the source tree to this external public repo may be gated by the auto-mode safety
  classifier — run the initial `gh repo create … --push` manually, or grant a `Bash(git push:*)`
  allow-rule, if a push doesn't go through silently.
- Workflow actions pin Node 20 (GitHub deprecation: forced to Node 24 on 2026-06-16) — bump action
  versions when convenient.

## Conventions

- TypeScript strict — no `any`, no `@ts-ignore`, no `// eslint-disable`
- File naming kebab-case; components PascalCase; functional components + hooks only
- WADS theme variables for color/spacing/typography — no hardcoded hex
- Mock data only — no real API integration

## What not to do

- Don't commit secrets, real credentials, or real customer data
- Don't add a second package manager (pnpm only)
- Don't update WADS to a `-rc` version without Artem's confirmation
- Don't auto-commit or push — leave changes in the working tree unless Artem asks
