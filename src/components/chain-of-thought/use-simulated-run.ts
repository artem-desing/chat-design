'use client';

import { useEffect, useState } from 'react';
import type { ChainDetail, ChainStep, StepType } from './types';

/**
 * Playground-only: a single simulated step. It carries BOTH labels — the
 * present-continuous one shown while active ("Analyzing…") and the past one
 * shown once done ("Analyzed 50 attacks"). In production the caller streams real
 * ChainSteps into <ChainOfThought>; here this hook fakes that stream.
 */
export interface SimStep {
  id: string;
  type: StepType;
  activeLabel: string;
  label: string;
  metric?: string;
  detail?: ChainDetail;
  /** How long this step stays "active" before it finishes (ms). */
  durationMs?: number;
}

export interface SimRun {
  id: string;
  /** Short label for the scenario picker. */
  label: string;
  /** Teaching hint shown under the stage. */
  hint: string;
  /** Summary duration, e.g. "7s" (omit for single-step runs). */
  durationLabel?: string;
  /** Faux assistant answer rendered OUTSIDE the trace once it folds (§10). */
  answer?: string;
  steps: SimStep[];
}

const STEP_GAP_MS = 180; // beat between one step finishing and the next starting
const FOLD_DELAY_MS = 450; // pause after the last step before auto-folding
const LEAD_IN_MS = 220; // small delay before the first step appears

/**
 * Drive a SimRun: reveal steps one at a time (each `active` then `done`), then
 * flip `running` to false so <ChainOfThought> auto-folds. Re-runs whenever the
 * scenario (`run`) or the replay `nonce` changes; cleans up its timers on change.
 */
export function useSimulatedRun(run: SimRun, nonce: number): { steps: ChainStep[]; running: boolean } {
  const [steps, setSteps] = useState<ChainStep[]>([]);
  const [running, setRunning] = useState(true);
  const [runKey, setRunKey] = useState(`${run.id}:${nonce}`);
  const nextKey = `${run.id}:${nonce}`;

  // Reset for a new scenario / replay during render (React's sanctioned
  // adjust-state-during-render pattern), so the effect below never calls
  // setState synchronously — it only schedules the reveal timers, whose
  // callbacks update state asynchronously.
  if (runKey !== nextKey) {
    setRunKey(nextKey);
    setSteps([]);
    setRunning(true);
  }

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const revealed: ChainStep[] = [];

    let delay = LEAD_IN_MS;
    run.steps.forEach((s, i) => {
      // Reveal as active: type icon + shimmering present-continuous label only.
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          revealed.push({ id: s.id, type: s.type, status: 'active', label: s.activeLabel });
          setSteps([...revealed]);
        }, delay),
      );
      delay += s.durationMs ?? 1200;

      // Settle to done: past-tense label, plus metric/detail become available.
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          revealed[i] = {
            id: s.id,
            type: s.type,
            status: 'done',
            label: s.label,
            metric: s.metric,
            detail: s.detail,
          };
          setSteps([...revealed]);
        }, delay),
      );
      delay += STEP_GAP_MS;
    });

    timers.push(
      setTimeout(() => {
        if (!cancelled) setRunning(false);
      }, delay + FOLD_DELAY_MS),
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [run, nonce]);

  return { steps, running };
}
