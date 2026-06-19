'use client';

import { useState } from 'react';

/**
 * Auto-fold + expand/collapse for the summary (spec §6.5 / §7).
 *
 * When `running` flips true → false the trace auto-folds to the summary
 * (collapsed), unless `defaultExpanded` says otherwise. The user can then
 * toggle it open/closed.
 */
export function useFoldState({
  running,
  defaultExpanded,
}: {
  running: boolean;
  defaultExpanded?: boolean;
}) {
  const collapsedDefault = defaultExpanded ?? false;
  const [expanded, setExpanded] = useState(collapsedDefault);
  const [wasRunning, setWasRunning] = useState(running);

  // The moment a run finishes (running true → false), reset to the
  // collapsed-by-default state. Adjusting state during render — not in an
  // effect — is React's sanctioned pattern for deriving from a prop change,
  // and avoids the set-state-in-effect render cascade.
  if (wasRunning !== running) {
    setWasRunning(running);
    if (!running) {
      setExpanded(collapsedDefault);
    }
  }

  return {
    expanded,
    toggle: () => setExpanded((e) => !e),
  };
}
