/**
 * Framework-agnostic canvas engine for the Wallarm chat background — a gentle,
 * premium ambient field that sits behind the chat surface. Two restrained
 * variants share one rAF loop, selected via `variant`:
 *
 *   - `particles` — a soft field of slowly drifting dots whose opacity breathes.
 *   - `aurora`    — a few large, heavily-feathered color blobs drifting on slow
 *                   Lissajous paths. Atmosphere, not focus.
 *
 * No framework imports — a thin React wrapper drives it, but it can equally be
 * mounted as a standalone injectable layer behind a real chat UI.
 *
 * PLACEHOLDER: the *motion* here is a tasteful stand-in until the chat-background
 * design requirements land. The *architecture* is the part meant to last —
 * token-driven colors (so light↔dark is a pure token swap), DPR-aware sizing,
 * `prefers-reduced-motion` freeze, visibility pause, and robust frame timing.
 * When the real design arrives, swap the two draw routines; keep the contract.
 */

export type Variant = 'particles' | 'aurora';

export interface EngineOptions {
  variant: Variant;
  /** particles: grid cell size in px (tighter = denser). aurora: blob count. */
  density: number;
  /** Drift speed multiplier. Keep low — this should read as barely moving. */
  speed: number;
  /** particles: dot radius in px. aurora: blob radius in px. */
  particleSize: number;
  /**
   * Softness. particles: halo radius as a multiple of the dot radius.
   * aurora: 0–1 feather — where the gradient's mid stop sits before it fades out.
   */
  glow: number;
  /** Drift direction in degrees (0 = →, 90 = ↓). The field slides this way. */
  drift: number;
  /** Global opacity multiplier (0–1). Keep low so it reads as atmosphere. */
  intensity: number;
  /**
   * Token-driven colors. CSS custom-property *names* resolved against the
   * canvas's computed style at runtime, so a dark theme is a pure token swap
   * with no engine change. Falls back to the prototype hexes if unresolved.
   */
  baseColorVar: string;
  dotColorVar: string;
  accentColorVar: string;
}

export const DEFAULTS: Record<
  Variant,
  Pick<EngineOptions, 'density' | 'particleSize' | 'glow'>
> = {
  particles: { density: 40, particleSize: 2.5, glow: 4 },
  aurora: { density: 5, particleSize: 300, glow: 0.55 },
};

interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ChatBackgroundEngine {
  /** Begin (or resume) the animation loop. Idempotent. */
  start(): void;
  /** Halt the loop and detach listeners. */
  stop(): void;
  /** Re-measure the canvas (DPR + CSS box) and re-lay the field. */
  resize(): void;
  /** Merge new options; re-lays the field if a structural option changed. */
  setOptions(partial: Partial<EngineOptions>): void;
  /** Paint a single frame without running the loop (used when paused). */
  renderStatic(): void;
}

// Last-resort hexes if a token doesn't resolve. Kept in sync with globals.css.
const FALLBACK: Record<string, string> = {
  '--chat-bg-base': '#f8fafc',
  '--chat-bg-dot': '#94a3b8',
  '--chat-bg-accent': '#f97316',
};

function parseColor(input: string, fallbackHex: string): RGB {
  const s = (input || '').trim();
  if (s.startsWith('rgb')) {
    const m = s.match(/[\d.]+/g);
    if (m && m.length >= 3) {
      return { r: Number(m[0]), g: Number(m[1]), b: Number(m[2]) };
    }
  }
  let h = s.startsWith('#') ? s.slice(1) : fallbackHex.slice(1);
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length !== 6) h = fallbackHex.slice(1);
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// A drifting particle. Position is in CSS px; the loop wraps it through the field
// as it drifts so the population reads as continuous.
interface Particle {
  x: number;
  y: number;
  /** Phase offset so dots don't all breathe in unison. */
  phase: number;
  /** Per-dot breathing frequency jitter. */
  freq: number;
  /** A small share of dots use the accent color instead of the dot color. */
  accent: boolean;
}

// A drifting aurora blob. Centre rides a slow Lissajous path around an anchor,
// expressed in fractions of the viewport so it survives a resize.
interface Blob {
  ax: number;
  ay: number;
  rx: number;
  ry: number;
  fx: number;
  fy: number;
  phase: number;
  accent: boolean;
}

// Deterministic per-index pseudo-random in [0,1). No Math.random, so layouts are
// stable across re-lays and screenshots are reproducible.
function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function createChatBackgroundEngine(
  canvas: HTMLCanvasElement,
  options: EngineOptions,
): ChatBackgroundEngine {
  const context = canvas.getContext('2d');
  if (!context) {
    const noop = () => {};
    return { start: noop, stop: noop, resize: noop, setOptions: noop, renderStatic: noop };
  }
  const ctx = context;

  let opts: EngineOptions = { ...options };
  let dpr = 1;
  let cssW = 0;
  let cssH = 0;
  let raf = 0;
  let running = false;
  let clock = 0; // accumulated animation seconds
  let lastT = 0; // previous rAF timestamp (ms); 0 = first frame after a (re)start

  let particles: Particle[] = [];
  let blobs: Blob[] = [];

  let base: RGB = parseColor('', FALLBACK['--chat-bg-base']);
  let dotColor: RGB = parseColor('', FALLBACK['--chat-bg-dot']);
  let accentColor: RGB = parseColor('', FALLBACK['--chat-bg-accent']);

  // Pre-rendered soft-dot sprites (particles variant) — one per color. Drawing a
  // cached sprite with per-particle globalAlpha is far cheaper than building a
  // radial gradient for every dot every frame, so the field stays smooth.
  let dotSprite: HTMLCanvasElement | null = null;
  let accentSprite: HTMLCanvasElement | null = null;
  let halo = 0; // sprite radius in CSS px

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

  function makeSprite(c: RGB): HTMLCanvasElement | null {
    const size = Math.max(2, Math.ceil(halo * 2 * dpr));
    const s = document.createElement('canvas');
    s.width = size;
    s.height = size;
    const sc = s.getContext('2d');
    if (!sc) return null;
    const mid = size / 2;
    const g = sc.createRadialGradient(mid, mid, 0, mid, mid, mid);
    g.addColorStop(0, `rgba(${c.r},${c.g},${c.b},1)`);
    g.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
    sc.fillStyle = g;
    sc.fillRect(0, 0, size, size);
    return s;
  }

  function buildSprites() {
    halo = Math.max(0.5, opts.particleSize) * (1 + Math.max(0, opts.glow));
    dotSprite = makeSprite(dotColor);
    accentSprite = makeSprite(accentColor);
  }

  function resolveColors() {
    const cs = getComputedStyle(canvas);
    base = parseColor(cs.getPropertyValue(opts.baseColorVar), FALLBACK[opts.baseColorVar] ?? '#f8fafc');
    dotColor = parseColor(cs.getPropertyValue(opts.dotColorVar), FALLBACK[opts.dotColorVar] ?? '#94a3b8');
    accentColor = parseColor(
      cs.getPropertyValue(opts.accentColorVar),
      FALLBACK[opts.accentColorVar] ?? '#f97316',
    );
    buildSprites(); // colors baked into the sprites — rebuild on every resolve
  }

  function layout() {
    if (opts.variant === 'particles') {
      const spacing = Math.max(8, opts.density);
      const cols = Math.ceil(cssW / spacing) + 1;
      const rows = Math.ceil(cssH / spacing) + 1;
      const count = Math.min(600, Math.max(0, cols * rows));
      particles = new Array(count);
      for (let i = 0; i < count; i++) {
        particles[i] = {
          x: rand(i + 1) * cssW,
          y: rand(i + 101) * cssH,
          phase: rand(i + 201) * Math.PI * 2,
          freq: 0.4 + rand(i + 301) * 0.6,
          accent: rand(i + 401) < 0.12,
        };
      }
    } else {
      const count = Math.max(2, Math.min(10, Math.round(opts.density)));
      blobs = new Array(count);
      for (let i = 0; i < count; i++) {
        blobs[i] = {
          ax: 0.15 + rand(i + 1) * 0.7,
          ay: 0.15 + rand(i + 51) * 0.7,
          rx: 0.1 + rand(i + 101) * 0.16,
          ry: 0.1 + rand(i + 151) * 0.16,
          fx: 0.05 + rand(i + 201) * 0.08,
          fy: 0.05 + rand(i + 251) * 0.08,
          phase: rand(i + 301) * Math.PI * 2,
          accent: i % 2 === 0,
        };
      }
    }
  }

  function resize() {
    dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    resolveColors();
    layout();
    if (!running) render();
  }

  // Unit drift vector shared by both variants.
  function driftVec() {
    const a = (opts.drift * Math.PI) / 180;
    return { dx: Math.cos(a), dy: Math.sin(a) };
  }

  function drawParticles() {
    if (!dotSprite || !accentSprite) return;
    const { dx, dy } = driftVec();
    const travel = 16; // px/sec at speed 1 — barely-there drift
    const ox = dx * travel * clock;
    const oy = dy * travel * clock;
    const m = halo;
    const spanX = cssW + 2 * m;
    const spanY = cssH + 2 * m;
    const d = halo * 2;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // Drift + wrap through the field (with a halo margin so dots fade past the
      // edges instead of popping in and out).
      let x = (p.x + ox) % spanX;
      if (x < 0) x += spanX;
      x -= m;
      let y = (p.y + oy) % spanY;
      if (y < 0) y += spanY;
      y -= m;
      const breathe = 0.5 + 0.5 * Math.sin(clock * p.freq + p.phase);
      const alpha = (0.12 + 0.5 * breathe) * opts.intensity;
      if (alpha <= 0.002) continue;
      ctx.globalAlpha = alpha > 1 ? 1 : alpha;
      ctx.drawImage(p.accent ? accentSprite : dotSprite, x - m, y - m, d, d);
    }
    ctx.globalAlpha = 1;
  }

  function drawAurora() {
    const { dx, dy } = driftVec();
    const slide = 0.03; // fraction of viewport/sec at speed 1
    const feather = Math.min(0.95, Math.max(0.05, opts.glow));
    const rad = opts.particleSize;
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const cx = (b.ax + b.rx * Math.sin(clock * b.fx + b.phase) + dx * slide * clock) * cssW;
      const cy = (b.ay + b.ry * Math.cos(clock * b.fy + b.phase) + dy * slide * clock) * cssH;
      // Wrap the slow linear slide so blobs don't all march off one edge.
      const wx = ((cx % cssW) + cssW) % cssW;
      const wy = ((cy % cssH) + cssH) % cssH;
      const c = b.accent ? accentColor : dotColor;
      const peak = 0.18 * opts.intensity;
      const g = ctx.createRadialGradient(wx, wy, 0, wx, wy, rad);
      g.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${peak})`);
      g.addColorStop(feather, `rgba(${c.r},${c.g},${c.b},${peak * 0.45})`);
      g.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(wx - rad, wy - rad, rad * 2, rad * 2);
    }
  }

  function render() {
    ctx.fillStyle = `rgb(${base.r},${base.g},${base.b})`;
    ctx.fillRect(0, 0, cssW, cssH);
    if (opts.variant === 'particles') drawParticles();
    else drawAurora();
  }

  function loop(t: number) {
    raf = 0;
    if (!running) return;
    // Robust dt: rAF timestamps can freeze or jump (tab restore, sandboxed
    // preview). Clamp to a sane frame budget and accumulate our own clock so the
    // motion stays smooth and monotonic regardless of the host's timing quirks.
    const dt = lastT ? Math.min(0.05, Math.max(0, (t - lastT) / 1000)) : 0;
    lastT = t;
    clock += dt * Math.max(0, opts.speed);
    render();
    schedule();
  }

  function schedule() {
    if (!running || raf) return;
    if (reduceMotion?.matches) {
      render(); // honor reduced-motion: hold a single static frame, no loop
      return;
    }
    if (typeof document !== 'undefined' && document.hidden) return;
    raf = requestAnimationFrame(loop);
  }

  function onVisibility() {
    if (document.hidden) {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    } else if (running) {
      lastT = 0; // avoid a dt spike across the hidden gap
      schedule();
    }
  }

  function onReduceChange() {
    if (!running) return;
    if (reduceMotion?.matches) {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      render();
    } else {
      lastT = 0;
      schedule();
    }
  }

  let listening = false;
  function attach() {
    if (listening || typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', onVisibility);
    reduceMotion?.addEventListener?.('change', onReduceChange);
    listening = true;
  }
  function detach() {
    if (!listening) return;
    document.removeEventListener('visibilitychange', onVisibility);
    reduceMotion?.removeEventListener?.('change', onReduceChange);
    listening = false;
  }

  function start() {
    if (running) {
      schedule();
      return;
    }
    running = true;
    lastT = 0;
    attach();
    resolveColors();
    schedule();
  }

  function stop() {
    running = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    detach();
  }

  function setOptions(partial: Partial<EngineOptions>) {
    const structural =
      (partial.variant !== undefined && partial.variant !== opts.variant) ||
      (partial.density !== undefined && partial.density !== opts.density);
    opts = { ...opts, ...partial };
    resolveColors(); // cheap; also catches a theme flip pushed via setOptions({})
    if (structural) layout();
    if (!running) render();
  }

  function renderStatic() {
    resolveColors();
    render();
  }

  // Initial measure so a pre-start renderStatic() already has a sized canvas.
  resize();

  return { start, stop, resize, setOptions, renderStatic };
}
