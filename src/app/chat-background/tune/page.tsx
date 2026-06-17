'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@wallarm-org/design-system/Button';
import { Switch } from '@wallarm-org/design-system/Switch';
import { SwitchControl } from '@wallarm-org/design-system/Switch';
import { SwitchLabel } from '@wallarm-org/design-system/Switch';
import { LiquidGradient } from '@/components/chat-background';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  readout: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, readout, onChange }: SliderProps) {
  return (
    <label className="flex flex-col gap-6">
      <span className="flex items-baseline justify-between text-xs font-medium text-[var(--color-text-secondary)]">
        <span>{label}</span>
        <span className="font-mono text-[var(--color-text-primary)]">{readout}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--color-text-tertiary)]"
      />
    </label>
  );
}

export default function ChatBackgroundPlayground() {
  // Defaults locked in the prototype: blur 90px, speed 2×, opacity 100%, not frozen.
  const [blur, setBlur] = useState(90);
  const [speed, setSpeed] = useState(2);
  const [opacity, setOpacity] = useState(1);
  const [frozen, setFrozen] = useState(false);
  // Preview-only: sweep the rendered frame width AND height independently to
  // confirm the field scales — and to see what a changed aspect does.
  const [previewWidth, setPreviewWidth] = useState(360);
  const [previewHeight, setPreviewHeight] = useState(640);

  return (
    <main className="relative min-h-dvh w-full bg-[var(--color-bg-page-bg)] px-24 py-24">
      {/* Back to the prototypes hub. */}
      <div className="absolute left-16 top-16 z-50">
        <Link href="/">
          <Button variant="outline" color="neutral">
            ← All prototypes
          </Button>
        </Link>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-24 pt-56">
        <header className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Wally — liquid mesh gradient
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Tune blur, speed and opacity. Freeze to grab a still.
          </p>
        </header>

        <div className="flex flex-wrap items-start gap-24">
          {/* Phone-proportioned preview (9:16). */}
          <div style={{ width: previewWidth, maxWidth: '100%', flex: '0 0 auto' }}>
            <LiquidGradient
              blur={blur}
              speed={speed}
              opacity={opacity}
              frozen={frozen}
              style={{ aspectRatio: 'auto', height: previewHeight }}
            />
          </div>

          {/* The tuner — four controls, the Storybook substitute for this prototype. */}
          <aside
            className="flex flex-col gap-20 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-surface-1)] p-20 shadow-sm"
            style={{ flex: '1 1 260px', minWidth: 260 }}
          >
            <Slider
              label="Blur"
              value={blur}
              min={0}
              max={120}
              step={1}
              readout={`${Math.round(blur)}px`}
              onChange={setBlur}
            />
            <Slider
              label="Speed"
              value={speed}
              min={0.25}
              max={3}
              step={0.05}
              readout={`${speed.toFixed(2)}x`}
              onChange={setSpeed}
            />
            <Slider
              label="Opacity"
              value={opacity}
              min={0.1}
              max={1}
              step={0.05}
              readout={`${Math.round(opacity * 100)}%`}
              onChange={setOpacity}
            />
            <Switch checked={frozen} onCheckedChange={(e) => setFrozen(e.checked)}>
              <SwitchControl />
              <SwitchLabel>
                <span className="text-xs text-[var(--color-text-secondary)]">Freeze animation</span>
              </SwitchLabel>
            </Switch>

            {/* Preview aid — NOT a gradient setting. Sweep the frame width to
                confirm the blur + composition hold at any rendered size. */}
            <div className="flex flex-col gap-12 border-t border-[var(--color-border-primary)] pt-16">
              <Slider
                label="Preview width"
                value={previewWidth}
                min={280}
                max={760}
                step={10}
                readout={`${previewWidth}px`}
                onChange={setPreviewWidth}
              />
              <Slider
                label="Preview height"
                value={previewHeight}
                min={360}
                max={900}
                step={10}
                readout={`${previewHeight}px`}
                onChange={setPreviewHeight}
              />
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Preview only — change width and height independently to test any size/aspect. Not gradient settings.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
