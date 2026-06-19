'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { Button } from '@wallarm-org/design-system/Button';
import { SegmentedControl } from '@wallarm-org/design-system/SegmentedControl';
import { SegmentedControlItem } from '@wallarm-org/design-system/SegmentedControl';
import { ChainOfThought } from '@/components/chain-of-thought';
import { useSimulatedRun } from '@/components/chain-of-thought/use-simulated-run';
import { RUNS } from '@/components/chain-of-thought/fixtures';

/**
 * Chain of thought — the playground. A simulated agent run streams into
 * <ChainOfThought>, then folds into one summary line when it finishes. The three
 * scenarios exercise the fold rule: mixed types → "Worked", one type → "Thought",
 * single step → the row itself. Replay re-runs the current scenario.
 */
export default function ChainOfThoughtPage() {
  const [runId, setRunId] = useState(RUNS[0].id);
  const [nonce, setNonce] = useState(0);
  const run = RUNS.find((r) => r.id === runId) ?? RUNS[0];
  const { steps, running } = useSimulatedRun(run, nonce);

  const pick = (id: string) => {
    setRunId(id);
    setNonce((n) => n + 1);
  };

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

      <div className="mx-auto flex max-w-2xl flex-col gap-24 pt-56">
        <header className="flex flex-col gap-8">
          <p className="text-sm font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase">
            Wallarm — Chat
          </p>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Chain of thought
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            How Wally’s reasoning streams in — the active step shimmers, finished steps sit
            above it — then folds into a single line when it’s done. Switch scenarios to see
            the fold rule change.
          </p>
        </header>

        {/* Scenario picker + replay. */}
        <div className="flex flex-wrap items-center gap-12">
          <SegmentedControl value={runId} onChange={pick}>
            {RUNS.map((r) => (
              <SegmentedControlItem key={r.id} value={r.id}>
                {r.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
          <Button
            variant="outline"
            color="neutral"
            className="ml-auto"
            onClick={() => setNonce((n) => n + 1)}
          >
            <RotateCcw size={15} aria-hidden="true" style={{ marginRight: 6, verticalAlign: -2 }} />
            Replay
          </Button>
        </div>

        {/* The chat stage: user message → trace → (answer, once folded). */}
        <div
          className="flex flex-col gap-12 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-page-bg)] p-20"
          style={{ minHeight: 240 }}
        >
          <div className="ml-auto w-max max-w-[82%] rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-light-primary)] px-12 py-8 text-sm text-[var(--color-text-secondary)]">
            Recent attacks → show all within last 24h
          </div>

          <ChainOfThought steps={steps} running={running} durationLabel={run.durationLabel} />

          {!running && run.answer ? (
            <p className="text-sm text-[var(--color-text-primary)]" style={{ lineHeight: 1.55 }}>
              {run.answer}
            </p>
          ) : null}
        </div>

        <p className="text-sm text-[var(--color-text-tertiary)]" style={{ minHeight: 16 }}>
          {run.hint}
        </p>
      </div>
    </main>
  );
}
