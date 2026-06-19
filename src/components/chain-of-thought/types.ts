import type { ReactNode } from 'react';

/**
 * Chain of Thought — data model (spec §2).
 *
 * The component is presentational / data-driven: it renders whatever `steps`
 * it's given. TYPE is what a step *is* (the resting identity); STATUS is where
 * it is in its lifecycle. A fixed glyph precedence (see chain-step.tsx / §4)
 * decides which icon the single 16px slot shows.
 */

export type StepType =
  // reasoning & control flow
  | 'thinking'
  | 'plan'
  | 'decision'
  // acting on the world
  | 'subagent'
  | 'tool'
  | 'command'
  | 'web-search'
  | 'query'
  | 'datastore'
  | 'api'
  | 'read'
  | 'fetch'
  | 'filter'
  // producing
  | 'create'
  | 'edit'
  | 'cite'
  // security (Wally)
  | 'threat-analysis'
  | 'detection';

export type StepStatus = 'pending' | 'active' | 'done' | 'error' | 'skipped';

export interface FindingItem {
  code: string; // e.g. "ptrav" — rendered as an inline-code chip
  on?: string; // e.g. "vapi.us.demo.wallarm.tools/api/note" — inline-code chip
  note?: string; // e.g. "10,000 hits, blocked" — plain trailing text
}

export type ChainDetail =
  | { kind: 'text'; text: string }
  | { kind: 'findings'; items: FindingItem[] }
  | { kind: 'node'; node: ReactNode };

export interface ChainStep {
  id: string;
  type: StepType;
  status: StepStatus;
  /** Present-continuous while active ("Analyzing…"); past once done ("Analyzed 50 attacks"). */
  label: string;
  /** Optional right-aligned value on the collapsed row, e.g. "50". */
  metric?: string;
  /** Expanded content: findings list, paragraph, or custom node. */
  detail?: ChainDetail;
  /** Nested steps — DEPTH 2 MAX (nested-in-nested, no deeper). */
  children?: ChainStep[];
}

export interface ChainOfThoughtProps {
  steps: ChainStep[];
  /** True while the agent is still working — drives the auto-fold on completion. */
  running: boolean;
  /** e.g. "7s" — shown in the folded summary line. */
  durationLabel?: string;
  /** Override the auto fold/unfold default. */
  defaultExpanded?: boolean;
  className?: string;
}

/** Result of summarizing a finished run into a single line (spec §7). */
export type SummaryInfo =
  | { kind: 'single'; step: ChainStep }
  | { kind: 'group'; icon: StepType; label: string }
  | { kind: 'worked'; label: string };
