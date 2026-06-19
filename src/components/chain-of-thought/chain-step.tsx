'use client';

import { useState } from 'react';
import type { ChainStep as ChainStepT } from './types';
import { TYPE_ICON } from './icons';
import { Slot, Collapsible } from './glyph';
import { Detail } from './detail';

/** A step can show nested content if it has detail, or children within depth. */
function isExpandable(step: ChainStepT, depth: number): boolean {
  const hasChildren = depth < 2 && !!step.children && step.children.length > 0;
  return !!step.detail || hasChildren;
}

/**
 * One trace row + its (recursive, depth-2) detail/children (spec §4–§5, §8).
 *
 * Glyph precedence: error → alert (danger); collapsible → type↔chevron slot;
 * otherwise → the type icon, dimmed for pending/skipped. "Live" is the shimmer
 * on the active label (§6.1), never color. The collapsible row is a <button>
 * and its expanded body is a SIBLING — so nested rows never nest <button>s.
 */
export function ChainStep({ step, depth }: { step: ChainStepT; depth: number }) {
  const [open, setOpen] = useState(false);
  const Icon = TYPE_ICON[step.type];
  const isError = step.status === 'error';
  const isActive = step.status === 'active';
  // Error overrides the glyph (no chevron swap), so an errored row isn't collapsible.
  const expandable = isExpandable(step, depth) && !isError;

  const label = isActive ? (
    <span className="cot-shim">{step.label}</span>
  ) : (
    <span className="cot-label">{step.label}</span>
  );
  const metric = step.metric ? <span className="cot-metric">{step.metric}</span> : null;

  if (!expandable) {
    return (
      <div className="cot-node">
        <div className="cot-row" data-status={step.status}>
          <Slot icon={Icon} error={isError} />
          {label}
          {metric}
        </div>
      </div>
    );
  }

  return (
    <div className="cot-node">
      <button
        type="button"
        className="cot-row is-collapsible"
        data-status={step.status}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Slot icon={Icon} collapsible />
        {label}
        {metric}
      </button>
      <Collapsible open={open}>
        <div className="cot-rail">
          {step.detail ? <Detail detail={step.detail} /> : null}
          {depth < 2 && step.children
            ? step.children.map((child) => (
                <ChainStep key={child.id} step={child} depth={depth + 1} />
              ))
            : null}
        </div>
      </Collapsible>
    </div>
  );
}
