@AGENTS.md

# Chat Background Prototype — Claude Code operating manual

## Project at a glance

Clickable Next.js prototype for exploring an animated **chat background** for
Wallarm — the ambient field that sits behind the chat surface. Sibling to the
`auth-design` and `global-navigation-prototype` prototypes — same stack and WADS
chassis, different surface. Discussion artifact, not production.

The chat background is the **Wally liquid mesh gradient** — six soft color blobs
drifting behind one large `filter: blur()`, on co-prime animation loops so the
field never visibly repeats. Built to the `wally-liquid-gradient` spec: plain CSS,
GPU-cheap (transform + opacity only), exact colors/sizes/positions/durations.
Light/dark make no difference to the gradient — its colors are hardcoded by design;
only the surrounding chrome is themed.

A second surface now lives alongside it: the **Chain of Thought** process trace — the
monochrome stream of reasoning / tool / subagent steps shown while Wally works, which
folds into one summary line when done. Built to the `wally-cot-requirements` spec; full
as-built details in `docs/chain-of-thought-handoff.md`.

Owner: Artem Miskevich (Head of Design, `amiskevich@wallarm.com`).

## Stack

- Next.js 16 (App Router) + Turbopack
- React 19 + TypeScript strict
- Tailwind CSS v4 (tokens come from WADS — do not redefine)
- `@wallarm-org/design-system@0.29.2` (WADS) plus peers: `tw-animate-css`, `non.geist`, `@internationalized/date`
- `lucide-react` — component icons (the Chain of Thought trace); WADS under-barrels its own lucide set
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
  (User, Sun, Bug, Eye) may be missing/unbarreled. For component icons use `lucide-react` directly
  (WADS' icons *are* lucide); inline a custom SVG only as a last resort.
- **`Text` defaults to `whitespace-pre-wrap`** — pass `truncate` or `style={{whiteSpace:'nowrap'}}`
  when it sits inside a nowrap parent.
- **`<button>` centers text** — add `text-left` to any button wrapping `<Text grow>`.

## Surfaces built so far

### Chat background (`src/components/chat-background/` + `src/app/chat-background/`)

The **Wally liquid mesh gradient** — the ambient backdrop for the Wally AI
assistant chat. Built to the `wally-liquid-gradient` spec: plain CSS, no Tailwind
in the component itself, so it lifts out cleanly into the real app later.

- `liquid-gradient.tsx` — the `LiquidGradient` component. Six color blobs
  (`BLOBS`), all children of one `.lg-mesh` layer so a **single** `filter: blur()`
  merges them into a continuous liquid field (never blur blobs individually).
  Prop-driven: `blur` / `speed` / `opacity` / `frozen` / `style` (the `style`
  passthrough lets the app override the 9:16 lock to fill its chat container).
  GPU-cheap (transform + opacity only); `aria-hidden`, no pointer interaction. A
  server component (no hooks), so it drops into both `final` and `tune`.
- `liquid-gradient.css` — plain global CSS: the `.lg-*` rules + the six
  `@keyframes` (`f1`–`f6`, referenced by the component's inline `animationName`) +
  the `prefers-reduced-motion` pause. Colors/sizes/positions/durations are the
  spec's source of truth — **don't round the durations** (23/29/31/37/41/43 are
  prime → the composite loop never visibly repeats), and the blob↔keyframe mapping
  is intentionally cross-wired (b3→f4, b4→f3).
- Speed preserves the co-prime relationship: each blob's `animationDuration` is
  `base / speed`, never one shared duration.
- **Blur is size-relative:** `.lg-frame` is a query container (`container-type:
  inline-size`) and the mesh blur is `blur(calc(var(--lg-blur) * 100cqw /
  var(--lg-blur-ref)))`, so softness stays constant at any rendered size. `blur` =
  px at the `--lg-blur-ref` (360) width. Width-anchored (`cqw`) → right for
  portrait; for aspect-independence swap to `cqmin` + `container-type: size`.
- **No theme tokens for the gradient** — its colors are hardcoded and identical in
  light and dark by design. Only the chrome around it is themed.
- **As-built defaults & deviations from the spec** (all in `docs/chat-background-handoff.md`):
  blur **90** / speed **2×**; white base (`#fff`, not the warm-grey gradient);
  softened orange core (`#ffb07e`); wider ~22–34% blob travel. Other blob
  colors/sizes/positions/durations are per spec.

Routes (the prototype's Storybook substitute):
- `/` — picker "super page" (mirrors the sibling prototypes' "Pick a variant" hub).
  Now two sections: **Chat background** and **Chain of thought**.
- `/chat-background/final` — clean ship-ready frame: the gradient at full strength
  in a 9:16 phone frame, no controls.
- `/chat-background/tune` — the playground: a 9:16 preview + four live controls
  (blur, speed, opacity, freeze) plus preview width/height sliders (a size/aspect
  test — not gradient settings). "← All prototypes" links back to the picker.

### Chain of thought (`src/components/chain-of-thought/` + `src/app/chain-of-thought/`)

The **process trace** for the Wally assistant — the monochrome stream of reasoning,
tool, and subagent steps shown while it works, which folds into a single summary line
when done. A presentational, data-driven `<ChainOfThought>` (renders whatever `steps`
it's given); a playground hook fakes the agent stream for the demo. Plain `.cot-*`
global CSS + WADS-token-mapped `--cot-*` vars, so it lifts out cleanly like the gradient.

- **Monochrome + motion:** the whole trace is secondary gray; "live" is the shimmering
  active-step label, never color. The only hue is danger (errors). **No brand orange.**
- **Icons:** `lucide-react` (see Stack). Inline code uses WADS `InlineCodeSnippet` (text
  recolored to secondary), on a **white** surface so its faint slate-@6% fill reads.
- **Fold rules:** single step → the row itself; one type → that type's verb ("Thought
  for 6s", never "Worked"); mixed → "Worked for {duration}" (`Activity`). On completion
  the steps **animate-collapse up into the summary** (a `live → folding → summary` phase
  machine), rather than snapping.
- **Composition:** a connector rail threads the icon gutter (the "chain"); collapsible
  rows swap their type icon → chevron on hover/expand (one dynamic slot); nesting 2 deep
  max. Glyph precedence, states, and animations are the spec's source of truth.
- **As-built spec & deviations** (all in `docs/chain-of-thought-handoff.md`): the
  `InlineCodeSnippet` + secondary-text + white-surface decisions, the connector rail and
  fold-collapse animation (both beyond the original spec), and the `lucide-react` choice.

Route:
- `/chain-of-thought` — the playground: a scenario picker (Mixed steps / Thinking only /
  Single step) + Replay, the user-query line, and the live trace. "← All prototypes" back
  to the picker. The picker, Replay, and `useSimulatedRun`/`fixtures` are throwaway tooling.

## Docs

- `docs/chat-background-handoff.md` — developer handoff for lifting the gradient into the
  real Wally app (as-built values, the white base, production opacity wiring 12%→5%; Figma
  source: file `bsqgrzkpIB2yPVlNpgU8jN`, `ChatBg` node `67:1254`).
- `docs/chain-of-thought-handoff.md` — component spec & developer handoff for the Chain of
  Thought trace (data model, type→lucide icon map, fold rules, animations incl. the collapse,
  WADS-token mappings, the `InlineCodeSnippet` + white-surface decisions; Figma file
  `bsqgrzkpIB2yPVlNpgU8jN`, nodes `409:3812` / `494:4292`).
- `README.md` — public-facing overview + run instructions.

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
