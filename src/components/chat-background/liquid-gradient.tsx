import './liquid-gradient.css';

export type BlobSpec = {
  name: string;
  style: React.CSSProperties; // size + position
  background: string; // radial-gradient
  anim: string; // keyframe name
  base: number; // base duration in seconds
};

// Six soft color blobs — exact values are the source of truth (see the Wally
// liquid-gradient spec §4.3 / §7.1). Do NOT round the durations: 23/29/31/37/41/43
// are prime, so the composite loop is their product and never visibly repeats.
// The anim↔blob mapping is intentionally cross-wired (b3→f4, b4→f3).
export const BLOBS: BlobSpec[] = [
  { name: 'b1-lavender-top',    style: { width: '66%', height: '52%', left: '-8%',  top: '-12%' },    background: 'radial-gradient(circle at 50% 50%, #cdccda 0%, rgba(205,204,218,0) 68%)', anim: 'f1', base: 37 },
  { name: 'b2-cream-right',     style: { width: '56%', height: '78%', right: '-13%', top: '6%' },      background: 'radial-gradient(circle at 50% 50%, #f6dba6 0%, rgba(246,219,166,0) 66%)', anim: 'f2', base: 29 },
  { name: 'b3-peach-halo',      style: { width: '78%', height: '64%', left: '10%',  bottom: '-20%' },  background: 'radial-gradient(circle at 50% 50%, #ffab70 0%, rgba(255,171,112,0) 68%)', anim: 'f4', base: 31 },
  { name: 'b4-orange-core',     style: { width: '60%', height: '48%', left: '22%',  bottom: '-10%' },  background: 'radial-gradient(circle at 50% 50%, #ff5e16 0%, #ff7a30 30%, rgba(255,122,48,0) 70%)', anim: 'f3', base: 23 },
  { name: 'b5-cream-lower',     style: { width: '60%', height: '56%', right: '-11%', bottom: '0%' },   background: 'radial-gradient(circle at 50% 50%, #f9e2b4 0%, rgba(249,226,180,0) 66%)', anim: 'f5', base: 41 },
  { name: 'b6-offwhite-center', style: { width: '76%', height: '62%', left: '13%',  top: '24%' },      background: 'radial-gradient(circle at 50% 50%, #f3eae0 0%, rgba(243,234,224,0) 70%)', anim: 'f6', base: 43 },
];

type Props = {
  blur?: number; // px
  speed?: number; // multiplier
  opacity?: number; // 0..1
  frozen?: boolean;
  className?: string;
};

/**
 * The Wally chat-background liquid mesh gradient. All six blobs are children of
 * a single `.lg-mesh` layer, so one `filter: blur()` merges them into a
 * continuous "liquid" field (do NOT blur blobs individually). GPU-cheap:
 * transform + opacity only. Decorative — `aria-hidden`, no pointer interaction.
 *
 * This is the component that would eventually move into the real app; keep it
 * free of playground/tuner concerns so it can be lifted out cleanly.
 */
export default function LiquidGradient({
  blur = 62,
  speed = 1,
  opacity = 1,
  frozen = false,
  className,
}: Props) {
  return (
    <div className={`lg-frame ${className ?? ''}`} aria-hidden="true">
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
