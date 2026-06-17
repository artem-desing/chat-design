# Wally chat background — developer handoff

**Component:** the animated *liquid mesh gradient* behind the Wally AI assistant chat.
**Status:** design-approved in the prototype; ready to lift into the app.
**Owner:** Artem Miskevich (Design, Wallarm) · `amiskevich@wallarm.com`
**Prototype:** https://artem-desing.github.io/chat-design/ · repo `artem-desing/chat-design`

---

## 1. What you're integrating

A soft "liquid mesh gradient" — six blurred color blobs drifting slowly behind a
single large blur, like a lava lamp. It's the **ambient backdrop** for the Wally
chat surface: cool lavender-gray top-left, warm cream down the right edge, a soft
warm bloom anchored bottom-center. GPU-cheap (`transform` + `opacity` only), it
**never visibly repeats** (blob loops run on co-prime prime-number durations), and
it **scales to any size** (composition is %-based; the blur is size-relative).

You're lifting **one component — `LiquidGradient`** — into the app. The prototype's
tuner UI (and its preview-size sliders) are throwaway tooling; ignore them.

**See it live:**
- Full strength: https://artem-desing.github.io/chat-design/chat-background/final/
- With the tuner: https://artem-desing.github.io/chat-design/chat-background/tune/
  (drag **Opacity** to 12% / 5% to preview the real states; drag **Preview width/height** to see it scale)

**Figma source:** `Wally — AI Assistant`, file key `bsqgrzkpIB2yPVlNpgU8jN`,
`ChatBg` node `67:1254` (variants `Main` = welcome, `Chat` = active conversation).

---

## 2. Key design decisions

Decided in design review — these are the source of truth:

1. **White base.** The fill *under* the mesh is **`#fff`** (not a warm-grey base) — the gradient is an ambient layer over the app's white surface, and at the 5–12% production opacity a non-white base reads as a dirty grey wash.
2. **Softer orange core.** Blob `b4` went from the hot `#ff5e16 → #ff7a30` to a pale peach **`#ffb07e → #ffc8a2`** — it was over-dominant against the pastel field.
3. **Wider, more "liquid" travel.** The `@keyframes` translate ranges were widened from ~8–18% to **~22–34%** of each blob's box (durations unchanged), for more flow.
4. **New defaults.** **Blur 90 · Speed 2×** (was 62 / 1×). Opacity 100%, Freeze off unchanged.
5. **Size-relative blur.** Blur now **scales with the rendered width** (CSS container query) instead of a fixed px, so the softness is identical at any screen size. See §5.

---

## 3. Canonical implementation (as built — copy this)

Two files. Plain CSS, **no Tailwind / no framework deps**. The `@keyframes` names
`f1`–`f6` are global and referenced from the inline `animationName`, so keep the
CSS global (do **not** convert it to a CSS Module).

### `LiquidGradient.tsx`

```tsx
import './liquid-gradient.css';

export type BlobSpec = {
  name: string;
  style: React.CSSProperties; // size + position
  background: string;         // radial-gradient
  anim: string;               // keyframe name
  base: number;               // base duration in seconds
};

// Six soft color blobs. Do NOT round the durations: 23/29/31/37/41/43 are prime,
// so the composite loop is their product and never visibly repeats. The
// anim↔blob mapping is intentionally cross-wired (b3→f4, b4→f3).
export const BLOBS: BlobSpec[] = [
  { name: 'b1-lavender-top',    style: { width: '66%', height: '52%', left: '-8%',  top: '-12%' },    background: 'radial-gradient(circle at 50% 50%, #cdccda 0%, rgba(205,204,218,0) 68%)', anim: 'f1', base: 37 },
  { name: 'b2-cream-right',     style: { width: '56%', height: '78%', right: '-13%', top: '6%' },      background: 'radial-gradient(circle at 50% 50%, #f6dba6 0%, rgba(246,219,166,0) 66%)', anim: 'f2', base: 29 },
  { name: 'b3-peach-halo',      style: { width: '78%', height: '64%', left: '10%',  bottom: '-20%' },  background: 'radial-gradient(circle at 50% 50%, #ffab70 0%, rgba(255,171,112,0) 68%)', anim: 'f4', base: 31 },
  { name: 'b4-orange-core',     style: { width: '60%', height: '48%', left: '22%',  bottom: '-10%' },  background: 'radial-gradient(circle at 50% 50%, #ffb07e 0%, #ffc8a2 33%, rgba(255,200,162,0) 70%)', anim: 'f3', base: 23 },
  { name: 'b5-cream-lower',     style: { width: '60%', height: '56%', right: '-11%', bottom: '0%' },   background: 'radial-gradient(circle at 50% 50%, #f9e2b4 0%, rgba(249,226,180,0) 66%)', anim: 'f5', base: 41 },
  { name: 'b6-offwhite-center', style: { width: '76%', height: '62%', left: '13%',  top: '24%' },      background: 'radial-gradient(circle at 50% 50%, #f3eae0 0%, rgba(243,234,224,0) 70%)', anim: 'f6', base: 43 },
];

type Props = {
  blur?: number;     // px at the reference width (--lg-blur-ref); scales with frame size
  speed?: number;    // multiplier (duration = base / speed)
  opacity?: number;  // 0..1
  frozen?: boolean;
  className?: string;
  style?: React.CSSProperties; // merged onto .lg-frame — e.g. override aspect-ratio to fill a container
};

export default function LiquidGradient({
  blur = 90,
  speed = 2,
  opacity = 1,
  frozen = false,
  className,
  style,
}: Props) {
  return (
    <div className={`lg-frame ${className ?? ''}`} style={style} aria-hidden="true">
      <div className="lg-mesh" style={{ '--lg-blur': blur, opacity } as React.CSSProperties}>
        {BLOBS.map((b) => (
          <div
            key={b.name}
            className={`lg-blob lg-${b.name}`}
            style={{
              ...b.style,
              background: b.background,
              animationName: b.anim,
              animationDuration: `${b.base / speed}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationPlayState: frozen ? 'paused' : 'running',
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### `liquid-gradient.css`

```css
.lg-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 16;        /* prototype framing — in the app, fill the chat container instead (see §5) */
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;         /* white base (see §2) — set to the chat surface color if not white */
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
  /* Query container so the blur scales with the rendered width. */
  container-type: inline-size;
  /* Width (px) at which `blur` equals its literal px value; scales linearly from here. */
  --lg-blur-ref: 360;
}

.lg-mesh {
  position: absolute;
  inset: 0;
  /* Size-relative blur: = --lg-blur px at --lg-blur-ref width, scaling
     proportionally otherwise (90px @360 → 180px @720 — same softness). */
  filter: blur(calc(var(--lg-blur, 90) * 100cqw / var(--lg-blur-ref, 360)));
}

.lg-blob {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
}

/* Travel ~22–34% of each blob's box for a "liquid" flow; durations stay long + co-prime. */
@keyframes f1 {
  0%   { transform: translate(0, 0) scale(1); }
  30%  { transform: translate(25%, 29%) scale(1.18); }
  60%  { transform: translate(-18%, 34%) scale(0.92); }
  100% { transform: translate(0, 0) scale(1); }
}
@keyframes f2 {
  0%   { transform: translate(0, 0) scale(1.08); }
  30%  { transform: translate(-29%, 18%) scale(0.88); }
  60%  { transform: translate(-13%, -25%) scale(1.16); }
  100% { transform: translate(0, 0) scale(1.08); }
}
@keyframes f3 {
  0%   { transform: translate(0, 0) scale(1); }
  35%  { transform: translate(22%, -29%) scale(1.26); }
  70%  { transform: translate(-25%, -9%) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
}
@keyframes f4 {
  0%   { transform: translate(0, 0) scale(1.12); }
  30%  { transform: translate(-25%, -22%) scale(0.86); }
  60%  { transform: translate(17%, -13%) scale(1.2); }
  100% { transform: translate(0, 0) scale(1.12); }
}
@keyframes f5 {
  0%   { transform: translate(0, 0) scale(1); }
  35%  { transform: translate(-29%, -32%) scale(1.18); }
  65%  { transform: translate(13%, -17%) scale(0.92); }
  100% { transform: translate(0, 0) scale(1); }
}
@keyframes f6 {
  0%   { transform: translate(0, 0) scale(1); }
  30%  { transform: translate(23%, 25%) scale(1.12); }
  60%  { transform: translate(-22%, 13%) scale(0.92); }
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
| 4 | `b4-orange-core`      | 60% × 48% | left 22%, bottom −10% | **`#ffb07e` → `#ffc8a2` 33% → transparent 70%** | `f3` | 23s |
| 5 | `b5-cream-lower`      | 60% × 56% | right −11%, bottom 0% | `#f9e2b4` → transparent 66% | `f5` | 41s |
| 6 | `b6-offwhite-center`  | 76% × 62% | left 13%, top 24%     | `#f3eae0` → transparent 70% | `f6` | 43s |

### Other values
- **Defaults:** Blur **90** · Speed **2×** · Opacity **100%** · Freeze **off**.
- **Base:** `#fff` (see §2).
- **Blur:** size-relative (§5). `90` = px at the 360px reference width; the rendered blur scales with width. Single blur on `.lg-mesh` — never blur blobs individually.
- **Durations** `23 / 29 / 31 / 37 / 41 / 43` are **prime** → never round them. At the default **2× speed** they render at half (`11.5 / 14.5 / 15.5 / 18.5 / 20.5 / 21.5s`) — still co-prime, so it never repeats. Always derive per-blob duration as `base / speed`; never share one duration.
- **Motion:** `ease-in-out`, `infinite`, 2 intermediate waypoints per blob.

---

## 5. Production wiring (the important part)

### Opacity states
Mount it **behind** the chat UI at reduced opacity, with two states by chat state:

| State | Mesh opacity | When |
|---|---|---|
| Welcome (`Main`) | **~12%** (`0.12`) | before a conversation starts |
| Active chat (`Chat`) | **~5%** (`0.05`) | once the first message is sent |

One CSS custom property flipped by a state class (don't swap assets / render two variants):

```css
.chat-bg__mesh { opacity: var(--bg-opacity, 0.12); transition: opacity 800ms ease; }
.chat-bg.is-chatting .chat-bg__mesh { --bg-opacity: 0.05; }
```

(~800ms ease; drop to ~400–500ms for a snappier send-tied feel — design TBD.) `aria-hidden`, no pointer interaction, z-index below content. `prefers-reduced-motion` pause is in the CSS.

### Size & aspect (robustness)
- **Size:** robust at any scale. Composition is %-based, and the blur scales with width (`container-type: inline-size` + `blur(... * 100cqw / --lg-blur-ref)`), so softness is identical at 1280 / 1440 / 1920 etc. Retune via the one `--lg-blur-ref` variable.
- **Fill the real container:** the prototype locks `aspect-ratio: 9/16`; in the app, override it via the `style` passthrough to fill the chat surface — e.g. `style={{ aspectRatio: 'auto', width: '100%', height: '100%' }}`.
- **Aspect:** the blur is anchored to **width** (`cqw`) — correct for a portrait surface at any size. The blobs are sized/positioned per-axis, so a changed aspect stretches them (fine for portrait; drifts toward square/landscape). If the surface width will vary a lot independent of height, switch the blur to the **smaller dimension**: `container-type: size` + `blur(... * 100cqmin / --lg-blur-ref)`.

---

## 6. Integration checklist

- [ ] `LiquidGradient` + its CSS dropped in; six blobs render with the exact values in §4.
- [ ] A **single** blur on `.lg-mesh`; blobs not blurred individually.
- [ ] Base is white (or the app's chat-surface color) — not grey.
- [ ] Blur scales with size (container query) — softness consistent across screen sizes.
- [ ] Fills the chat container (override the 9:16 lock via `style`).
- [ ] Opacity driven by `--bg-opacity` (12% welcome → 5% chat) over ~800ms.
- [ ] Behind the chat UI, `aria-hidden`, no pointer interaction.
- [ ] `prefers-reduced-motion: reduce` pauses it.
- [ ] Colors identical in light & dark — no inversion, no `prefers-color-scheme` block for the gradient.
- [ ] Co-prime durations preserved (`base / speed`).

---

## 7. Reference
- **Prototype source:** `src/components/chat-background/` (`liquid-gradient.tsx` + `liquid-gradient.css`). The prototype wraps the component in a 9:16 frame + a blur/speed/opacity/freeze tuner (with preview-size sliders) — none of that ships.
- **Figma:** `Wally — AI Assistant`, file key `bsqgrzkpIB2yPVlNpgU8jN`, `ChatBg` node `67:1254`.
