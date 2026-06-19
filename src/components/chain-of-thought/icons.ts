import {
  Activity,
  Bot,
  Brain,
  ChevronRight,
  Database,
  Download,
  FilePlus,
  FileText,
  Filter,
  GitBranch,
  Globe,
  Link as LinkIcon,
  ListChecks,
  Pencil,
  Plug,
  Radar,
  Search,
  ShieldAlert,
  Terminal,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { StepType } from './types';

/**
 * StepType → lucide-react icon (spec §3). lucide is the same glyph set WADS
 * ships its own icons from — but WADS only barrels ~12 of the 18 we need here,
 * so we pull all of them from lucide-react directly (spec mandate, and visually
 * consistent with the design system). All render at 16px, color var(--cot-fg).
 */
export const TYPE_ICON: Record<StepType, LucideIcon> = {
  thinking: Brain,
  plan: ListChecks,
  decision: GitBranch,
  subagent: Bot,
  tool: Wrench,
  command: Terminal,
  'web-search': Globe,
  query: Search,
  datastore: Database,
  api: Plug,
  read: FileText,
  fetch: Download,
  filter: Filter,
  create: FilePlus,
  edit: Pencil,
  cite: LinkIcon,
  'threat-analysis': ShieldAlert,
  detection: Radar,
};

/** Verb used when a finished run is homogeneous (one type only) — spec §7. */
export const GROUP_VERB: Record<StepType, string> = {
  thinking: 'Thought',
  plan: 'Planned',
  decision: 'Decided',
  subagent: 'Delegated',
  tool: 'Ran tools',
  command: 'Ran commands',
  'web-search': 'Searched',
  query: 'Queried',
  datastore: 'Accessed data',
  api: 'Called APIs',
  read: 'Read',
  fetch: 'Fetched',
  filter: 'Filtered',
  create: 'Created',
  edit: 'Edited',
  cite: 'Cited',
  'threat-analysis': 'Analyzed',
  detection: 'Scanned',
};

/** Heterogeneous run → generic "Worked for …" with Activity (spec §7). */
export const SUMMARY_ICON: LucideIcon = Activity;

// Structural / state glyphs shared by the row components.
export { ChevronRight, TriangleAlert };
export type { LucideIcon };
