# Wally — Liquid Mesh Gradient Background + Tuner

**Requirements & build spec for Claude Code**
Version 1.0 · Owner: Artem (Design, Wallarm) · Target: standalone playground repo on GitHub

---

## 0. TL;DR for the agent

Build a small **Vite + React + TypeScript** app that renders an **animated liquid mesh gradient** (six soft color blobs drifting behind a large blur) inside a phone-proportioned preview frame, alongside a **control panel** to live-tune the animation: blur, speed, opacity, and a freeze toggle.

Constraints that matter:
- **Plain CSS only. No Tailwind, no CSS-in-JS libraries.**
- The animation must be **GPU-cheap** (`transform` + `opacity` only) and **never visibly repeat** (blob loops run on co-prime durations).
- Reproduce the values in this doc **exactly** — they are the source of truth. The reference implementation in §7 is canonical; copy it, don't reinvent it.
- No cursor/pointer interaction. The motion is autonomous "random fluid."

If a value here conflicts with your instinct, follow the doc.

---

## 1. Purpose & context

This is the ambient background for the **Wally AI Assistant** chat surface (Wallarm's API-security product). It's a soft mesh gradient — cool lavender-gray at the top-left, warm cream down the right edge, and a vivid orange bloom anchored bottom-center — that drifts slowly like a lava lamp.

This repo is **not production code**. It's a tuning playground so the design + engineering can agree on the final motion/blur/opacity values before they're lifted into the real app. The deliverable is a runnable demo with controls, deployable as a static site.

**Design source of truth (Figma):**
- File: `Wally — AI Assistant`, file key `bsqgrzkpIB2yPVlNpgU8jN`
- Background component: `ChatBg`, node `67:1254`, with two variants:
  - `Main` (welcome screen) — gradient more visible
  - `Chat` (active conversation) — gradient faded back
- The Figma mesh layer is annotated `mesh (CSS blur 70px ≈ Figma 150px)` — i.e. a CSS `filter: blur(70px)` matches a Figma layer blur of ~150px (roughly a 2× ratio). The prototype default is `62px`; `70px` is the Figma-matched value. Either is fine — it's a slider.

---

## 2. Tech stack & tooling

| Concern | Choice |
|---|---|
| Build tool | Vite |
| Framework | React 18 |
| Language | TypeScript |
| Styling | Plain CSS (`.css` files + inline styles). **No Tailwind.** |
| State | React `useState` only — no state library |
| Node | 18+ |
| Package manager | npm (yarn/pnpm fine if you prefer) |
| Deploy (optional) | Netlify, Vercel, or GitHub Pages — static build |

Scaffold with: `npm create vite@latest wally-bg-gradient -- --template react-ts`

---

## 3. Repository structure

```
wally-bg-gradient/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ README.md
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ components/
   │  ├─ LiquidGradient.tsx      # the gradient itself (reusable, prop-driven)
   │  ├─ LiquidGradient.css      # @keyframes + blob base styles
   │  └─ GradientPlayground.tsx  # preview frame + control panel
   └─ styles/
      └─ playground.css          # control-panel layout (optional, can be inline)
```

`LiquidGradient` is the component that would eventually move into the real app. `GradientPlayground` is the throwaway tuning UI wrapping it. Keep them cleanly separated so the gradient can be copied out later without dragging the controls along.

---

## 4. The gradient — visual spec

### 4.1 Frame (preview container)
- Aspect ratio **9:16** (Figma reference frame is **480 × 853**). In the playground, render at a comfortable fixed width (e.g. 320–360px) with `aspect-ratio: 9/16`; the component should otherwise fill its parent.
- `overflow: hidden`, `border-radius: 16px`, subtle `box-shadow: 0 0 0 1px rgba(0,0,0,0.06)`.
- **Base fill:** Figma source is solid `#ece4dc`. The prototype used a subtle base gradient for a touch more depth: `linear-gradient(165deg, #e7e4e6 0%, #efe7e0 55%, #f2e8df 100%)`. **Use the prototype gradient base** (it's what "this animation" looks like); note `#ece4dc` as the flat fallback.

### 4.2 Mesh layer
- A single absolutely-positioned layer, `inset: 0`, holding all six blobs.
- `filter: blur(<blur>px)` — **default 62px** (see controls).
- `opacity: <opacity>` — **default 1** (see controls).
- All six blobs are children of this one layer, so a **single blur** merges them into a continuous "liquid" field. Do **not** blur blobs individually.

### 4.3 The six blobs

Each blob is a `<div>` with `border-radius: 50%`, a `radial-gradient` fill fading to transparent, and one independent animation. Positions are percentages relative to the mesh layer; sizes are percentages of the frame. `translate()` values in keyframes are relative to each blob's own box.

| # | Name (matches Figma layer) | Size (w × h) | Position | Radial fill | Keyframe | Duration |
|---|---|---|---|---|---|---|
| 1 | `b1-lavender-top`     | 66% × 52% | left -8%, top -12%   | `#cdccda` 0% → transparent 68% | `f1` | 37s |
| 2 | `b2-cream-right`      | 56% × 78% | right -13%, top 6%   | `#f6dba6` 0% → transparent 66% | `f2` | 29s |
| 3 | `b3-peach-halo`       | 78% × 64% | left 10%, bottom -20%| `#ffab70` 0% → transparent 68% | `f4` | 31s |
| 4 | `b4-orange-core`      | 60% × 48% | left 22%, bottom -10%| `#ff5e16` 0% → `#ff7a30` 30% → transparent 70% | `f3` | 23s |
| 5 | `b5-cream-lower`      | 60% × 56% | right -11%, bottom 0%| `#f9e2b4` 0% → transparent 66% | `f5` | 41s |
| 6 | `b6-offwhite-center`  | 76% × 62% | left 13%, top 24%    | `#f3eae0` 0% → transparent 70% | `f6` | 43s |

Notes:
- The **orange core** (`b4`) is the focal point — most saturated, biggest movement. The **peach halo** (`b3`) sits under/around it to soften the transition into the warm field.
- All radial gradients are `radial-gradient(circle at 50% 50%, <stops>)`.
- The blobs intentionally bleed off the frame edges (negative offsets) so the color reaches the edges; the blur's soft transparent halo falls outside the visible area.

### 4.4 Why these durations
`23, 29, 31, 37, 41, 43` are all **prime** → co-prime with each other. The composite loop length is their product (millions of seconds), so the field never visibly repeats. **Do not "round" these to nicer numbers** — that's what reintroduces a visible cycle.

### 4.5 Motion feel
The keyframes were tuned to be **clearly alive but calm** — each blob wanders through 2 intermediate waypoints (not a simple back-and-forth) with translate ranges of roughly 8–18% and scale between 0.9 and 1.2. Timing function `ease-in-out`, `infinite`. Exact keyframes in §7.2.

### 4.6 Dark theme — no color changes (gradient only)
**Scope:** this rule is **strictly about the background animation's colors** — the base fill, the six blob colors, and the blur. Those **do not change between light and dark theme**; they stay exactly as specified. This was verified against the existing specs and reads fine in both themes, so **no dark-mode variant, no color inversion, no `prefers-color-scheme` overrides** are needed for the gradient.

Everything else (the surrounding UI — playground chrome, controls, any future app chrome around the gradient) would of course adapt to dark theme as normal. **That adaptation is out of scope for this document** and is not specified here.

Practical guidance for the agent:
- For the **gradient only**: hardcode the hex values exactly as in §4.3 / §7. Do **not** wire the gradient colors to theme tokens, and do **not** add a `@media (prefers-color-scheme: dark)` block for them. (The only `prefers-*` rule in scope for the gradient is the `prefers-reduced-motion` pause in §7.2.)
- A theme switch at the app level leaves the gradient layer untouched; only the chrome around it responds to theme — and that chrome is not part of this spec.

---

## 5. Controls (the tuner)

Four controls in a side panel. All update the gradient live.

| Control | Type | Range / values | Step | Default | Effect |
|---|---|---|---|---|---|
| **Blur** | range slider | 0 – 120 (px) | 1 | **62** | Sets `filter: blur(Npx)` on the mesh layer. Show readout `"Npx"`. |
| **Speed** | range slider | 0.25 – 3 (×) | 0.05 | **1** | Scales each blob's duration: `animationDuration = baseDuration / speed`. Higher = faster. Readout `"N.NNx"` (2 dp). |
| **Opacity** | range slider | 0.1 – 1 | 0.05 | **1** | Sets `opacity` on the mesh layer. Readout as percent, rounded int (`"100%"`). |
| **Freeze animation** | checkbox | — | — | off | Sets `animation-play-state: paused/running` on all blobs. For grabbing a still. |

Behavior requirements:
- **Speed must preserve the co-prime relationship.** Always derive from the base durations in §4.3 (`base / speed`); never hardcode a single duration for all blobs.
- All displayed numbers go through `Math.round` / `.toFixed` — no float artifacts (`0.30000004`).
- Sliders use the React state values as the single source of truth (controlled inputs).

### 5.1 Layout
- Two-column on desktop (preview left, panel right), stacking to one column when narrow (`flex-wrap`).
- Panel: light surface card, ~1.25rem padding, rounded corners. Label + right-aligned value above each slider.
- Keep it visually quiet — this is a tool, not a showcase. Neutral grays, no brand color in the chrome.

---

## 6. Production usage context (reference — not part of the playground UI)

> This section is **context for later**, so the values live in one place. **Do not build the chat-bubble mockup** — the playground only needs the four sliders above. The opacity slider already lets Artem preview these target values by hand.

In the real app the gradient is an **ambient backdrop behind UI**, at reduced opacity, with a two-state behavior driven by chat state:

| State | Mesh opacity | When |
|---|---|---|
| Welcome screen (`Main`) | **~12%** (`0.12`) | Before a conversation starts |
| Active chat (`Chat`) | **~5%** (`0.05`) | Once the first message is sent |

- Transition: animate `opacity` over **~800ms ease** (drop to ~400–500ms if a snappier, send-tied feel is wanted — TBD by design).
- Recommended production wiring: expose a single CSS custom property on the mesh container — `--bg-opacity` — and flip it with a state class rather than swapping assets or rendering two component variants:

```css
.chat-bg__mesh { opacity: var(--bg-opacity, 0.12); transition: opacity 800ms ease; }
.chat-bg.is-chatting .chat-bg__mesh { --bg-opacity: 0.05; }
```

- The Figma `ChatBg` component encodes these as `Main`/`Chat` variants; the raw opacity is a layer property (not a bound variable), so treat `0.12` / `0.05` as the agreed targets.

If you want, the playground can later add two preset buttons ("Welcome 12% / Chat 5%") that just drive the existing opacity state — but that's optional and out of scope for v1.

---

## 7. Canonical reference implementation

Copy these. They reflect the exact current prototype (including the more-noticeable motion).

### 7.1 `src/components/LiquidGradient.tsx`

```tsx
import "./LiquidGradient.css";

export type BlobSpec = {
  name: string;
  style: React.CSSProperties; // size + position
  background: string;         // radial-gradient
  anim: string;               // keyframe name
  base: number;               // base duration in seconds
};

export const BLOBS: BlobSpec[] = [
  { name: "b1-lavender-top",    style: { width: "66%", height: "52%", left: "-8%",  top: "-12%" },    background: "radial-gradient(circle at 50% 50%, #cdccda 0%, rgba(205,204,218,0) 68%)", anim: "f1", base: 37 },
  { name: "b2-cream-right",     style: { width: "56%", height: "78%", right: "-13%", top: "6%" },      background: "radial-gradient(circle at 50% 50%, #f6dba6 0%, rgba(246,219,166,0) 66%)", anim: "f2", base: 29 },
  { name: "b3-peach-halo",      style: { width: "78%", height: "64%", left: "10%",  bottom: "-20%" },  background: "radial-gradient(circle at 50% 50%, #ffab70 0%, rgba(255,171,112,0) 68%)", anim: "f4", base: 31 },
  { name: "b4-orange-core",     style: { width: "60%", height: "48%", left: "22%",  bottom: "-10%" },  background: "radial-gradient(circle at 50% 50%, #ff5e16 0%, #ff7a30 30%, rgba(255,122,48,0) 70%)", anim: "f3", base: 23 },
  { name: "b5-cream-lower",     style: { width: "60%", height: "56%", right: "-11%", bottom: "0%" },   background: "radial-gradient(circle at 50% 50%, #f9e2b4 0%, rgba(249,226,180,0) 66%)", anim: "f5", base: 41 },
  { name: "b6-offwhite-center", style: { width: "76%", height: "62%", left: "13%",  top: "24%" },      background: "radial-gradient(circle at 50% 50%, #f3eae0 0%, rgba(243,234,224,0) 70%)", anim: "f6", base: 43 },
];

type Props = {
  blur?: number;     // px
  speed?: number;    // multiplier
  opacity?: number;  // 0..1
  frozen?: boolean;
  className?: string;
};

export default function LiquidGradient({
  blur = 62,
  speed = 1,
  opacity = 1,
  frozen = false,
  className,
}: Props) {
  return (
    <div className={`lg-frame ${className ?? ""}`} aria-hidden="true">
      <div
        className="lg-mesh"
        style={{ filter: `blur(${blur}px)`, opacity }}
      >
        {BLOBS.map((b) => (
          <div
            key={b.name}
            className={`lg-blob lg-${b.name}`}
            style={{
              ...b.style,
              background: b.background,
              animationName: b.anim,
              animationDuration: `${b.base / speed}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationPlayState: frozen ? "paused" : "running",
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 7.2 `src/components/LiquidGradient.css`

```css
.lg-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 16;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(165deg, #e7e4e6 0%, #efe7e0 55%, #f2e8df 100%);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.lg-mesh {
  position: absolute;
  inset: 0;
}

.lg-blob {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
}

@keyframes f1 {
  0%   { transform: translate(0, 0) scale(1); }
  30%  { transform: translate(12%, 14%) scale(1.12); }
  60%  { transform: translate(-8%, 18%) scale(0.96); }
  100% { transform: translate(0, 0) scale(1); }
}
@keyframes f2 {
  0%   { transform: translate(0, 0) scale(1.06); }
  30%  { transform: translate(-14%, 8%) scale(0.92); }
  60%  { transform: translate(-6%, -12%) scale(1.1); }
  100% { transform: translate(0, 0) scale(1.06); }
}
@keyframes f3 {
  0%   { transform: translate(0, 0) scale(1); }
  35%  { transform: translate(10%, -14%) scale(1.2); }
  70%  { transform: translate(-12%, -4%) scale(0.94); }
  100% { transform: translate(0, 0) scale(1); }
}
@keyframes f4 {
  0%   { transform: translate(0, 0) scale(1.1); }
  30%  { transform: translate(-12%, -10%) scale(0.9); }
  60%  { transform: translate(8%, -6%) scale(1.14); }
  100% { transform: translate(0, 0) scale(1.1); }
}
@keyframes f5 {
  0%   { transform: translate(0, 0) scale(1); }
  35%  { transform: translate(-14%, -16%) scale(1.12); }
  65%  { transform: translate(6%, -8%) scale(0.95); }
  100% { transform: translate(0, 0) scale(1); }
}
@keyframes f6 {
  0%   { transform: translate(0, 0) scale(1); }
  30%  { transform: translate(11%, 12%) scale(1.08); }
  60%  { transform: translate(-10%, 6%) scale(0.95); }
  100% { transform: translate(0, 0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .lg-blob { animation: none !important; }
}
```

### 7.3 `src/components/GradientPlayground.tsx`

```tsx
import { useState } from "react";
import LiquidGradient from "./LiquidGradient";

export default function GradientPlayground() {
  const [blur, setBlur] = useState(62);
  const [speed, setSpeed] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [frozen, setFrozen] = useState(false);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-start" }}>
      <div style={{ width: 340, maxWidth: "100%", flex: "0 0 auto" }}>
        <LiquidGradient blur={blur} speed={speed} opacity={opacity} frozen={frozen} />
      </div>

      <div style={{ flex: "1 1 260px", minWidth: 260, background: "#f5f4f1", borderRadius: 12, padding: "1.25rem" }}>
        <Slider label="Blur" value={blur} min={0} max={120} step={1} onChange={setBlur} readout={`${Math.round(blur)}px`} />
        <Slider label="Speed" value={speed} min={0.25} max={3} step={0.05} onChange={setSpeed} readout={`${speed.toFixed(2)}x`} />
        <Slider label="Opacity" value={opacity} min={0.1} max={1} step={0.05} onChange={setOpacity} readout={`${Math.round(opacity * 100)}%`} />
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#555", cursor: "pointer" }}>
          <input type="checkbox" checked={frozen} onChange={(e) => setFrozen(e.target.checked)} />
          Freeze animation
        </label>
      </div>
    </div>
  );
}

function Slider(props: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; readout: string;
}) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
        <span style={{ color: "#555" }}>{props.label}</span>
        <span style={{ fontWeight: 500 }}>{props.readout}</span>
      </div>
      <input
        type="range"
        min={props.min} max={props.max} step={props.step} value={props.value}
        onChange={(e) => props.onChange(parseFloat(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}
```

### 7.4 `src/App.tsx`

```tsx
import GradientPlayground from "./components/GradientPlayground";

export default function App() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "0.25rem" }}>Wally — liquid mesh gradient</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>Tune blur, speed, and opacity. Freeze to grab a still.</p>
      <GradientPlayground />
    </main>
  );
}
```

---

## 8. Optional enhancements (only if asked)

Nice-to-haves — implement only on request, keep v1 lean:
- **Per-blob color pickers** — drive the `background` stop colors from state (the `BLOBS` array makes this straightforward).
- **Copy-CSS button** — outputs the current `filter`, `opacity`, and resolved durations as a ready-to-paste block.
- **Reset** — restore defaults (62 / 1 / 1 / off).
- **Welcome/Chat presets** — two buttons that set opacity to 0.12 / 0.05 (see §6).

---

## 9. Acceptance criteria

The build is done when:
- [ ] `npm run dev` shows the gradient drifting autonomously, no cursor interaction anywhere.
- [ ] All six blobs render with the exact colors, sizes, positions, and durations in §4.3.
- [ ] A single blur applies to the whole mesh (blobs are not individually blurred).
- [ ] Blur / Speed / Opacity sliders and Freeze all work live, with correctly rounded readouts.
- [ ] Speed derives per-blob duration as `base / speed` — the co-prime durations are preserved.
- [ ] Motion is clearly noticeable but calm at the default 1x (matches §4.5).
- [ ] `prefers-reduced-motion: reduce` pauses the animation.
- [ ] Colors are identical in light and dark theme — no inversion, no `prefers-color-scheme` block for the gradient (see §4.6).
- [ ] No Tailwind. Plain CSS only.
- [ ] `npm run build` produces a clean static bundle.

---

## 10. Ready-to-paste Claude Code kickoff prompt

> Open a terminal in your target folder, run `claude`, and paste:

```
Read ./wally-liquid-gradient-requirements.md in full, then build the app exactly as specified.

Steps:
1. Scaffold a Vite + React + TypeScript app named wally-bg-gradient (no Tailwind).
2. Create the files in §3 using the canonical reference implementation in §7 verbatim
   (LiquidGradient.tsx, LiquidGradient.css, GradientPlayground.tsx, App.tsx).
3. Wire main.tsx to render <App/>.
4. Run npm install and npm run dev, confirm the gradient animates and all four controls work.
5. Write a short README.md describing what it is and how to run it.
6. Initialize git, make an initial commit, and create a new public GitHub repo named
   wally-bg-gradient, then push. (Use the gh CLI; ask me before the push if auth is needed.)

Do not add the chat-bubble mockup. Do not change any color, size, position, or duration value.
After it runs, tell me the exact default values in use so I can confirm against the doc.
```

(Adjust repo name / visibility to taste. Let the agent do `git init` and `gh repo create` rather than handing it credentials.)

---

*End of spec.*
