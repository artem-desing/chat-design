'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@wallarm-org/design-system/Button';
import { SegmentedControl } from '@wallarm-org/design-system/SegmentedControl';
import { SegmentedControlItem } from '@wallarm-org/design-system/SegmentedControl';
import { Switch } from '@wallarm-org/design-system/Switch';
import { SwitchControl } from '@wallarm-org/design-system/Switch';
import { SwitchLabel } from '@wallarm-org/design-system/Switch';
import { ChatBackground, DEFAULTS, type Variant } from '@/components/chat-background';

interface Knobs {
  variant: Variant;
  density: number;
  speed: number;
  particleSize: number;
  glow: number;
  drift: number;
  intensity: number;
  paused: boolean;
}

function defaultsFor(variant: Variant): Knobs {
  const d = DEFAULTS[variant];
  return {
    variant,
    density: d.density,
    speed: variant === 'aurora' ? 0.6 : 0.5,
    particleSize: d.particleSize,
    glow: d.glow,
    drift: variant === 'aurora' ? 35 : 90,
    intensity: variant === 'aurora' ? 0.7 : 0.55,
    paused: false,
  };
}

// Slider ranges differ per variant — density is a px spacing for particles but a
// blob count for aurora; size/glow live on entirely different scales.
const RANGES: Record<Variant, Record<'density' | 'particleSize' | 'glow', [number, number, number]>> = {
  particles: { density: [16, 80, 1], particleSize: [1, 8, 0.5], glow: [0, 8, 0.5] },
  aurora: { density: [2, 10, 1], particleSize: [120, 460, 10], glow: [0.1, 0.95, 0.05] },
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <label className="flex flex-col gap-6">
      <span className="flex items-baseline justify-between text-xs font-medium text-[var(--color-text-secondary)]">
        <span>{label}</span>
        <span className="font-mono text-[var(--color-text-primary)]">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-w-orange-500)]"
      />
    </label>
  );
}

export default function ChatBackgroundPlayground() {
  const [knobs, setKnobs] = useState<Knobs>(() => defaultsFor('particles'));
  const [dark, setDark] = useState(false);

  // Playground-only theme switch so the dark token swap can be checked without
  // changing OS settings. The real page sets data-theme from the system theme.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    return () => root.removeAttribute('data-theme');
  }, [dark]);

  const set = <K extends keyof Knobs>(key: K, value: Knobs[K]) =>
    setKnobs((prev) => ({ ...prev, [key]: value }));

  // Switching variant resets the variant-specific knobs to that variant's
  // defaults, but speed / drift / intensity / paused are variant-independent so
  // we carry them over.
  const switchVariant = (variant: Variant) =>
    setKnobs((prev) => ({
      ...defaultsFor(variant),
      speed: prev.speed,
      drift: prev.drift,
      intensity: prev.intensity,
      paused: prev.paused,
    }));

  const r = RANGES[knobs.variant];

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[var(--chat-bg-base)]">
      {/* The animated field. In production the real chat sits on top of this. */}
      <ChatBackground
        variant={knobs.variant}
        density={knobs.density}
        speed={knobs.speed}
        particleSize={knobs.particleSize}
        glow={knobs.glow}
        drift={knobs.drift}
        intensity={knobs.intensity}
        paused={knobs.paused}
      />

      {/* Preview-only mock panel — NOT shipped. Stands in for the chat surface. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-24">
        <div className="pointer-events-auto h-[80vh] w-full max-w-2xl rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-surface-1)] shadow-xl" />
      </div>

      {/* Back to the prototypes hub. */}
      <div className="absolute left-16 top-16 z-50">
        <Link href="/">
          <Button variant="outline" color="neutral">
            ← All prototypes
          </Button>
        </Link>
      </div>

      {/* Tuning controls — the Storybook substitute for this prototype. */}
      <aside className="absolute right-16 top-16 flex w-300 flex-col gap-16 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-surface-1)] p-20 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Chat background
          </span>
          <Switch checked={dark} onCheckedChange={(e) => setDark(e.checked)}>
            <SwitchControl />
            <SwitchLabel>
              <span className="text-xs text-[var(--color-text-secondary)]">Dark</span>
            </SwitchLabel>
          </Switch>
        </div>

        <div className="flex flex-col gap-8">
          <SegmentedControl
            fullWidth
            value={knobs.variant}
            onChange={(v) => switchVariant(v as Variant)}
          >
            <SegmentedControlItem value="particles">Particles</SegmentedControlItem>
            <SegmentedControlItem value="aurora">Aurora</SegmentedControlItem>
          </SegmentedControl>
        </div>

        <Slider
          label="Intensity"
          value={knobs.intensity}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => set('intensity', v)}
        />
        <Slider
          label="Speed"
          value={knobs.speed}
          min={0}
          max={2}
          step={0.05}
          onChange={(v) => set('speed', v)}
        />
        <Slider
          label={knobs.variant === 'aurora' ? 'Blob count' : 'Spacing (px)'}
          value={knobs.density}
          min={r.density[0]}
          max={r.density[1]}
          step={r.density[2]}
          onChange={(v) => set('density', v)}
        />
        <Slider
          label={knobs.variant === 'aurora' ? 'Blob radius (px)' : 'Dot size (px)'}
          value={knobs.particleSize}
          min={r.particleSize[0]}
          max={r.particleSize[1]}
          step={r.particleSize[2]}
          onChange={(v) => set('particleSize', v)}
        />
        <Slider
          label={knobs.variant === 'aurora' ? 'Feather' : 'Glow'}
          value={knobs.glow}
          min={r.glow[0]}
          max={r.glow[1]}
          step={r.glow[2]}
          onChange={(v) => set('glow', v)}
        />
        <Slider
          label="Drift (deg)"
          value={knobs.drift}
          min={0}
          max={360}
          step={5}
          onChange={(v) => set('drift', v)}
        />

        <Switch checked={knobs.paused} onCheckedChange={(e) => set('paused', e.checked)}>
          <SwitchControl />
          <SwitchLabel>
            <span className="text-xs text-[var(--color-text-secondary)]">Freeze</span>
          </SwitchLabel>
        </Switch>

        <Button variant="outline" color="neutral" onClick={() => switchVariant(knobs.variant)}>
          Reset to defaults
        </Button>
      </aside>
    </main>
  );
}
