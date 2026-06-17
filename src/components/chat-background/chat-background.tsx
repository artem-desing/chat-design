'use client';

import { useEffect, useRef } from 'react';
import {
  createChatBackgroundEngine,
  DEFAULTS,
  type ChatBackgroundEngine,
  type EngineOptions,
  type Variant,
} from './engine';

export interface ChatBackgroundProps {
  /** `particles` (soft drifting dots) vs `aurora` (slow soft color blobs). */
  variant?: Variant;
  /** particles: grid cell size in px (tighter = denser). aurora: blob count. */
  density?: number;
  /** Drift speed multiplier. Keep low — barely-there motion. */
  speed?: number;
  /** particles: dot radius (px). aurora: blob radius (px). */
  particleSize?: number;
  /** Softness — halo multiple (particles) / gradient feather 0–1 (aurora). */
  glow?: number;
  /** Drift direction in degrees (0 = →, 90 = ↓). */
  drift?: number;
  /** Global opacity multiplier (0–1). Keep low so it reads as atmosphere. */
  intensity?: number;
  /** CSS custom-property name for the base fill. */
  baseColorVar?: string;
  /** CSS custom-property name for the dot/blob color. */
  dotColorVar?: string;
  /** CSS custom-property name for the accent dot/blob color. */
  accentColorVar?: string;
  /** Force a single static frame instead of running the animation loop. */
  paused?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function resolveOptions(props: ChatBackgroundProps): EngineOptions {
  const variant = props.variant ?? 'particles';
  const d = DEFAULTS[variant];
  return {
    variant,
    density: props.density ?? d.density,
    speed: props.speed ?? (variant === 'aurora' ? 0.6 : 0.5),
    particleSize: props.particleSize ?? d.particleSize,
    glow: props.glow ?? d.glow,
    drift: props.drift ?? (variant === 'aurora' ? 35 : 90),
    intensity: props.intensity ?? (variant === 'aurora' ? 0.7 : 0.55),
    baseColorVar: props.baseColorVar ?? '--chat-bg-base',
    dotColorVar: props.dotColorVar ?? '--chat-bg-dot',
    accentColorVar: props.accentColorVar ?? '--chat-bg-accent',
  };
}

/**
 * Decorative animated chat background. Renders only the field — the real chat UI
 * sits on top. Fills its nearest positioned ancestor by default; pass a
 * `className` (e.g. `fixed inset-0`) to mount it as a full-viewport layer.
 * Purely decorative: `aria-hidden`, never in the tab order, no pointer events.
 */
export function ChatBackground(props: ChatBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ChatBackgroundEngine | null>(null);

  // Latest options mirrored into a ref so the mount-scoped effect and its
  // observers always read current values without re-subscribing.
  const options = resolveOptions(props);
  const optionsRef = useRef(options);
  const pausedRef = useRef(props.paused);
  useEffect(() => {
    optionsRef.current = options;
    pausedRef.current = props.paused;
  });

  // A primitive signature that changes whenever any tunable changes — the sole
  // dependency for the live-update effect (avoids depending on a fresh object
  // identity every render).
  const signature = JSON.stringify({ ...options, paused: !!props.paused });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createChatBackgroundEngine(canvas, optionsRef.current);
    engineRef.current = engine;

    if (pausedRef.current) {
      engine.stop();
      engine.renderStatic();
    } else {
      engine.start();
    }

    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => engine.resize());
    });
    ro.observe(canvas);

    // Re-resolve token colors when the app flips theme (data-theme / class on
    // <html>), so the field follows light↔dark live without a remount.
    const themeObserver = new MutationObserver(() => engine.setOptions({}));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    return () => {
      ro.disconnect();
      themeObserver.disconnect();
      cancelAnimationFrame(frame);
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setOptions(optionsRef.current);
    if (pausedRef.current) {
      engine.stop();
      engine.renderStatic();
    } else {
      engine.start();
    }
  }, [signature]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={props.className ?? 'absolute inset-0 h-full w-full'}
      style={{ pointerEvents: 'none', ...props.style }}
    />
  );
}
