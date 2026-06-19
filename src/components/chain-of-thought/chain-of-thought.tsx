'use client';

import './chain-of-thought.css';
import { useEffect, useState } from 'react';
import type { ChainOfThoughtProps } from './types';
import { ChainStep } from './chain-step';
import { ChainSummary, summarize } from './chain-summary';
import { useFoldState } from './use-fold-state';
import { Slot } from './glyph';
import { TYPE_ICON, SUMMARY_ICON } from './icons';

/** How long the one-shot fold (steps collapsing into the summary) plays. */
const FOLD_ANIM_MS = 280;

/**
 * <ChainOfThought> — the Wally process-trace (spec §0–§9).
 *
 * Presentational / data-driven: while `running`, it renders the live step list
 * (the latest, active step shimmers — there is no separate "Working…" row). When
 * `running` goes false it auto-folds to one summary line. For multi-step runs the
 * fold is animated: the summary line appears and the step list collapses up into
 * it (a one-shot "folding" phase between live and summary). The assistant's final
 * answer is NOT part of this component — it renders separately, below it.
 */
export function ChainOfThought({
  steps,
  running,
  durationLabel,
  defaultExpanded,
  className,
}: ChainOfThoughtProps) {
  const { expanded, toggle } = useFoldState({ running, defaultExpanded });
  const cls = ['cot', className].filter(Boolean).join(' ');

  // Phase machine: live (running) → folding (one-shot collapse) → summary.
  // Adjusting state during render is React's sanctioned pattern for reacting to
  // a prop change without a set-state-in-effect cascade.
  const [wasRunning, setWasRunning] = useState(running);
  const [folding, setFolding] = useState(false);
  const [listOpen, setListOpen] = useState(true);

  if (wasRunning !== running) {
    setWasRunning(running);
    // Only animate the fold when there is a list to collapse (multi-step).
    const shouldFold = !running && steps.length > 1;
    setFolding(shouldFold);
    setListOpen(true);
  }

  // Drive the one-shot fold: paint the list open, collapse it next frame, then
  // hand off to the real (collapsed) summary. setState lives in async callbacks,
  // so the effect body never sets state synchronously.
  useEffect(() => {
    if (!folding) {
      return;
    }
    const raf = requestAnimationFrame(() => setListOpen(false));
    const done = setTimeout(() => setFolding(false), FOLD_ANIM_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [folding]);

  if (steps.length === 0) {
    return null;
  }

  if (running) {
    return (
      <div className={cls} role="log" aria-live="polite">
        <div className="cot-list">
          {steps.map((s) => (
            <ChainStep key={s.id} step={s} depth={1} />
          ))}
        </div>
      </div>
    );
  }

  if (folding) {
    const info = summarize(steps, durationLabel);
    const Icon = info.kind === 'group' ? TYPE_ICON[info.icon] : SUMMARY_ICON;
    return (
      <div className={cls}>
        {/* The parent line emerges… */}
        <div className="cot-node">
          <div className="cot-row cot-summary cot-fold-summary">
            <Slot icon={Icon} />
            <span className="cot-label cot-summary-label">{'label' in info ? info.label : ''}</span>
          </div>
        </div>
        {/* …and the finished steps collapse up into it. */}
        <div className={`cot-collapse cot-fold-list${listOpen ? ' is-open' : ''}`}>
          <div className="cot-collapse-inner">
            <div className="cot-list">
              {steps.map((s) => (
                <ChainStep key={s.id} step={s} depth={1} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cls}>
      <ChainSummary
        steps={steps}
        durationLabel={durationLabel}
        expanded={expanded}
        onToggle={toggle}
      />
    </div>
  );
}
