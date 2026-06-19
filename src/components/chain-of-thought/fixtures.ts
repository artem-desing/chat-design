import type { FindingItem } from './types';
import type { SimRun } from './use-simulated-run';

/**
 * Real Wallarm attack data for the playground (spec §11). Three scenarios that
 * exercise the three fold rules: heterogeneous → "Worked", homogeneous →
 * "Thought", single step → the row itself.
 */
const ATTACKS: FindingItem[] = [
  { code: 'ptrav', on: 'vapi.us.demo.wallarm.tools/api/note', note: '10,000 hits, blocked' },
  { code: 'account_takeover', on: 'rsa-api-sessions-demo.darkmatter.wallarm.tools/signin', note: '10,010 hits, blocked' },
  { code: 'rce', on: 'vapi.us.demo.wallarm.tools/api/note', note: '6,700 hits, blocked' },
  { code: 'mcp_parameter_violation', on: 'crm.darkmatter.wallarm.tools/mcp', note: '6,012 hits, blocked' },
];

// 1) Mixed types → "Worked for 7s" (Activity icon).
const mixed: SimRun = {
  id: 'mixed',
  label: 'Mixed steps',
  hint: 'Mixed types → folds into “Worked for 7s” (Activity). Hover a row: the icon becomes a chevron. Click to expand.',
  durationLabel: '7s',
  answer:
    'In the last 24h I found 50 attacks across 4 types — heaviest were account takeover (10,010) and path traversal (10,000). All were blocked.',
  steps: [
    {
      id: '1',
      type: 'thinking',
      activeLabel: 'Thinking…',
      label: 'Thought for 2s',
      detail: { kind: 'text', text: 'Plan: pull the last 24h of attacks, rank by hits, summarize.' },
      durationMs: 1200,
    },
    { id: '2', type: 'subagent', activeLabel: 'Querying traffic subagent…', label: 'Subagent · traffic', durationMs: 1100 },
    { id: '3', type: 'datastore', activeLabel: 'Fetching events…', label: 'Fetched attack events', metric: '50', durationMs: 1100 },
    {
      id: '4',
      type: 'threat-analysis',
      activeLabel: 'Analyzing…',
      label: 'Analyzed 50 attacks',
      detail: { kind: 'findings', items: ATTACKS },
      durationMs: 1300,
    },
    { id: '5', type: 'create', activeLabel: 'Writing summary…', label: 'Created summary', durationMs: 1000 },
  ],
};

// 2) Homogeneous (all thinking) → "Thought for 6s", never "Worked".
const thinkingOnly: SimRun = {
  id: 'think',
  label: 'Thinking only',
  hint: 'One type only → stays “Thought for 6s”, never “Worked”. Hover/click any row to expand its reasoning.',
  durationLabel: '6s',
  answer: 'Ready — I’ll query the traffic subagent, rank the last 24h of attacks by hits, and group them by type.',
  steps: [
    {
      id: '1',
      type: 'thinking',
      activeLabel: 'Thinking…',
      label: 'Considered the request',
      detail: { kind: 'text', text: 'User wants every attack in the last 24h, summarized.' },
      durationMs: 1300,
    },
    {
      id: '2',
      type: 'thinking',
      activeLabel: 'Planning…',
      label: 'Outlined the steps',
      detail: { kind: 'text', text: 'Query traffic subagent → rank by hits → summarize.' },
      durationMs: 1300,
    },
    {
      id: '3',
      type: 'thinking',
      activeLabel: 'Deciding…',
      label: 'Picked the grouping',
      detail: { kind: 'text', text: 'Group by attack type, note blocked status.' },
      durationMs: 1300,
    },
  ],
};

// 3) Single step → just the row, expandable to its findings (no wrapper).
const single: SimRun = {
  id: 'one',
  label: 'Single step',
  hint: 'Single step → just the row, no “for Ns” wrapper. Hover/click to open its findings.',
  answer: 'I analyzed 50 attacks across 4 types — all blocked. Expand the step above for the per-endpoint breakdown.',
  steps: [
    {
      id: '1',
      type: 'threat-analysis',
      activeLabel: 'Analyzing attacks…',
      label: 'Analyzed 50 attacks',
      detail: { kind: 'findings', items: ATTACKS },
      durationMs: 1800,
    },
  ],
};

export const RUNS: SimRun[] = [mixed, thinkingOnly, single];
