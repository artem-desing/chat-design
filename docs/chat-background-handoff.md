# Wally chat background — developer handoff

**Component:** the animated *liquid mesh gradient* behind the Wally AI assistant chat.
**Status:** design-approved in the prototype; ready to lift into the app.
**Owner:** Artem Miskevich (Design, Wallarm) · `amiskevich@wallarm.com`
**Prototype:** https://artem-desing.github.io/chat-design/ · repo `artem-desing/chat-design`

---

## 1. What you're integrating

A soft "liquid mesh gradient" — six blurred color blobs drifting slowly behind a
single large blur, like a lava lamp. It's the **ambient backdrop** for the Wally
chat surface: cool lavender-gray top-left, warm cream down the right edge, a vivid
orange bloom anchored bottom-center. GPU-cheap (`transform` + `opacity` only), and
it **never visibly repeats** (the blob loops run on co-prime prime-number durations).

You're lifting **one component — `LiquidGradient`** — into the app. The prototype's
tuner UI is a throwaway tuning tool; ignore it.

**See it live:**
- Full strength: https://artem-desing.github.io/chat-design/chat-background/final/
- With the tuner: https://artem-desing.github.io/chat-design/chat-background/tune/
  (drag **Opacity** down to 12% / 5% to preview the real production states — see §5)

**Figma source of truth:** `Wally — AI Assistant`, file key `bsqgrzkpIB2yPVlNpgU8jN`,
`ChatBg` node `67:1254` (variants `Main` = welcome screen, `Chat` = active conversation).

---

## 2. The one change from the original spec: white base

The base fill **under** the mesh is **white (`#fff`)** — *not* the warm-grey gradient
in the original build spec (§4.1). Rationale: the gradient is an ambient layer that
sits over the app's white surface at low opacity (5–12%, see §5); a non-white base
reads as a dirty grey wash at those opacities.

Everything else — blob colors, sizes, positions, durations, blur, motion — is exactly
as originally specified.

> If the real chat surface is **not** white, set the base to that surface color (or
> make the frame transparent and let the surface show through). Don't reintroduce a
> grey base.

---

## 3. Canonical implementation (as built — copy this)

Two files. Plain CSS, **no Tailwind / no CSS-in-JS / no framework deps** — lift both
as-is. The `@keyframes` names `f1`–`f6` are global and referenced from the inline
`animationName`, so keep the CSS global (do **not** convert it to a CSS Module).

### `LiquidGradient.tsx`

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
      <div className="lg-mesh" style={{ filter: `blur(${blur}px)`, opacity }}>
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

### `LiquidGradient.css`

```css
.lg-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 16;
  border-radius: 16px;
  overflow: hidden;
  /* Base under the mesh: WHITE (see §2). Set to the chat surface color if not white. */
  background: #ffffff;
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

---

## 4. Values — source of truth

### The six blobs

| # | Name (Figma layer) | Size (w × h) | Position | Radial fill | Keyframe | Duration |
|---|---|---|---|---|---|---|
| 1 | `b1-lavender-top`     | 66% × 52% | left −8%, top −12%    | `#cdccda` → transparent 68% | `f1` | 37s |
| 2 | `b2-cream-right`      | 56% × 78% | right −13%, top 6%    | `#f6dba6` → transparent 66% | `f2` | 29s |
| 3 | `b3-peach-halo`       | 78% × 64% | left 10%, bottom −20% | `#ffab70` → transparent 68% | `f4` | 31s |
| 4 | `b4-orange-core`      | 60% × 48% | left 22%, bottom −10% | `#ff5e16` → `#ff7a30` 30% → transparent 70% | `f3` | 23s |
| 5 | `b5-cream-lower`      | 60% × 56% | right −11%, bottom 0% | `#f9e2b4` → transparent 66% | `f5` | 41s |
| 6 | `b6-offwhite-center`  | 76% × 62% | left 13%, top 24%     | `#f3eae0` → transparent 70% | `f6` | 43s |

- The **orange core** (`b4`) is the focal point; the **peach halo** (`b3`) sits under it.
- The blob↔keyframe mapping is intentionally cross-wired (`b3`→`f4`, `b4`→`f3`).
- Blobs bleed off the frame edges (negative offsets) so color reaches the edges.

### Other values
- **Base:** `#fff` (see §2).
- **Blur:** `62px` default. `70px` is the Figma-matched value (CSS `blur(70px)` ≈ Figma layer blur ~150px). Single blur on the `.lg-mesh` layer — **never** blur blobs individually.
- **Durations** `23 / 29 / 31 / 37 / 41 / 43` are **prime** → composite loop = their product (millions of seconds), so it never visibly repeats. **Do not round them.**
- **Motion:** `ease-in-out`, `infinite`; each blob wanders through 2 intermediate waypoints (translate ≈ 8–18%, scale 0.9–1.2). "Clearly alive but calm."
- If you expose a speed control, derive each blob's duration as `base / speed` — preserve the co-prime relationship; never share one duration across blobs.

---

## 5. Production wiring (the important part)

In the app the gradient is an ambient backdrop **behind** the chat UI at reduced
opacity, with two states driven by chat state:

| State | Mesh opacity | When |
|---|---|---|
| Welcome (`Main`) | **~12%** (`0.12`) | before a conversation starts |
| Active chat (`Chat`) | **~5%** (`0.05`) | once the first message is sent |

Recommended wiring — one CSS custom property flipped by a state class (don't swap
assets or render two component variants):

```css
.chat-bg__mesh { opacity: var(--bg-opacity, 0.12); transition: opacity 800ms ease; }
.chat-bg.is-chatting .chat-bg__mesh { --bg-opacity: 0.05; }
```

- Transition `~800ms ease` (drop to ~400–500ms for a snappier, send-tied feel — design TBD).
- The `0.12` / `0.05` are the agreed targets (raw layer opacity in Figma's `Main`/`Chat` variants, not a bound variable).
- Mount it **behind all chat content** (z-index below the UI), `aria-hidden`, no pointer interaction.
- `prefers-reduced-motion: reduce` pauses the drift (already in the CSS).

---

## 6. Integration checklist

- [ ] `LiquidGradient` + its CSS dropped in; all six blobs render with the exact values in §4.
- [ ] A **single** blur on the `.lg-mesh` layer; blobs are not blurred individually.
- [ ] Base is white (or the app's chat-surface color) — not grey.
- [ ] Opacity driven by `--bg-opacity` (12% welcome → 5% chat) over ~800ms ease.
- [ ] Sits behind the chat UI, `aria-hidden`, no pointer/cursor interaction.
- [ ] `prefers-reduced-motion: reduce` pauses the animation.
- [ ] Colors identical in light & dark — no inversion, no `prefers-color-scheme` block for the gradient.
- [ ] Co-prime durations preserved.

---

## 7. Reference
- **Original design/build spec** (full rationale, Figma annotations, the tuner spec): [`wally-liquid-gradient-spec.md`](./wally-liquid-gradient-spec.md)
- **Prototype source:** `src/components/chat-background/` (`liquid-gradient.tsx` + `liquid-gradient.css`) in this repo. The prototype wraps the component in a 9:16 frame and a blur/speed/opacity/freeze tuner — neither is needed in production.
