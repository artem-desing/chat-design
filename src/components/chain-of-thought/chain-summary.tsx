'use client';

import type { ChainStep as ChainStepT, SummaryInfo } from './types';
import { TYPE_ICON, GROUP_VERB, SUMMARY_ICON } from './icons';
import { Slot, Collapsible } from './glyph';
import { ChainStep } from './chain-step';

/**
 * Derive the folded summary from the finished step set (spec §7):
 *  - 1 step           → the row itself IS the summary (no wrapper).
 *  - homogeneous      → that type's verb, e.g. "Thought for 6s" (never "Worked").
 *  - heterogeneous    → "Worked for {duration}" with the Activity icon.
 * The collapsed summary shows time only — no right-side meta.
 */
export function summarize(steps: ChainStepT[], duration?: string): SummaryInfo {
  if (steps.length === 1) {
    return { kind: 'single', step: steps[0] };
  }
  const types = new Set(steps.map((s) => s.type));
  if (types.size === 1) {
    const t = [...types][0];
    return { kind: 'group', icon: t, label: `${GROUP_VERB[t] ?? 'Worked'} for ${duration ?? ''}`.trim() };
  }
  return { kind: 'worked', label: `Worked for ${duration ?? ''}`.trim() };
}

/**
 * The folded summary row (spec §7). For a single step the row IS the step
 * (reusing ChainStep, expandable to its own detail). For grouped/heterogeneous
 * runs it's a collapsible row that expands to the full step list under a rail.
 * Its expand state is controlled by the parent (auto-fold lives there).
 */
export function ChainSummary({
  steps,
  durationLabel,
  expanded,
  onToggle,
}: {
  steps: ChainStepT[];
  durationLabel?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const info = summarize(steps, durationLabel);

  if (info.kind === 'single') {
    return <ChainStep step={info.step} depth={1} />;
  }

  const Icon = info.kind === 'group' ? TYPE_ICON[info.icon] : SUMMARY_ICON;

  return (
    <div className="cot-node">
      <button
        type="button"
        className="cot-row cot-summary is-collapsible"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <Slot icon={Icon} collapsible />
        <span className="cot-label cot-summary-label">{info.label}</span>
      </button>
      <Collapsible open={expanded}>
        <div className="cot-rail">
          {steps.map((s) => (
            <ChainStep key={s.id} step={s} depth={1} />
          ))}
        </div>
      </Collapsible>
    </div>
  );
}
