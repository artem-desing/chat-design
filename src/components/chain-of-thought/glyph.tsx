import type { ReactNode } from 'react';
import { ChevronRight, TriangleAlert, type LucideIcon } from './icons';

/**
 * The single dynamic glyph slot (spec §4 / §6.4). On a collapsible row it
 * renders BOTH the type icon and the chevron stacked in one 16px box; CSS swaps
 * which is visible on hover / expand. An errored row shows only the alert glyph
 * (error overrides everything — precedence rule 1).
 */
export function Slot({
  icon: Icon,
  collapsible,
  error,
}: {
  icon: LucideIcon;
  collapsible?: boolean;
  error?: boolean;
}) {
  if (error) {
    return (
      <span className="cot-slot">
        <TriangleAlert className="type" size={16} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="cot-slot">
      <Icon className="type" size={16} aria-hidden="true" />
      {collapsible ? <ChevronRight className="chev" size={16} aria-hidden="true" /> : null}
    </span>
  );
}

/**
 * Height-animated expand/collapse wrapper (spec §6.5). Uses the grid-rows
 * 0fr↔1fr technique so it animates without measuring content height.
 */
export function Collapsible({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`cot-collapse${open ? ' is-open' : ''}`}>
      {/* `inert` while closed removes the clipped subtree from the tab order and
          the accessibility tree (the grid-rows clip is visual-only, so without
          this a folded trace leaks focusable nested buttons — WCAG 2.4.3). It
          toggles instantly; the height/opacity transition still plays. */}
      <div className="cot-collapse-inner" inert={!open}>
        {children}
      </div>
    </div>
  );
}
