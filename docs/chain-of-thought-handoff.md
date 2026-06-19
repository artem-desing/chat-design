# Wally chat — Chain of Thought — component spec & developer handoff

**Component:** `<ChainOfThought>` — the process-trace that shows Wally's reasoning,
tool, and subagent steps while it works, then folds into one summary line when done.
**Status:** design-approved in the prototype; ready to lift into the app.
**Owner:** Artem Miskevich (Design, Wallarm) · `amiskevich@wallarm.com`
**Prototype:** https://artem-desing.github.io/chat-design/chain-of-thought/ · repo `artem-desing/chat-design`
**Figma source:** `Wally — AI Assistant`, file key `bsqgrzkpIB2yPVlNpgU8jN` —
node `409:3812` (*Layout* — the agnostic anatomy/spec), node `494:4292` (*dark ui* — real-data execution).

---

## 1. What you're integrating

A **monochrome process trace**. While the agent works, steps stream in one per row —
the active step's label *shimmers*; finished steps sit above it, static. When the run
ends, the trace **folds into a single summary line** ("Worked for 7s") and the steps
**collapse up into it**. Any collapsed row expands on click to reveal its detail
(reasoning text or a findings list), nesting up to **2 deep**.

You're lifting **one component — `<ChainOfThought>`** into the app. It is
**presentational / data-driven**: it renders whatever `steps` it's given. The
prototype's scenario picker, Replay button, and the `useSimulatedRun` hook + fixtures
are throwaway tooling — in production the caller streams real agent steps into the same
props.

**The answer is NOT part of this component.** `<ChainOfThought>` renders only the
trace; the assistant's final message renders separately, below it.

**See it live** (scenario toggles exercise the three fold rules):
- https://artem-desing.github.io/chat-design/chain-of-thought/
  — *Mixed steps* → "Worked for 7s"; *Thinking only* → "Thought for 6s"; *Single step* → the row itself.

---

## 2. Key design decisions

Decided in design review / from the Figma frames — these are the source of truth:

1. **Monochrome + motion.** The whole trace is **secondary gray** (`--cot-fg`). "Live"
   is conveyed by *motion* (the shimmering label), never by color. The **only** color in
   the trace is **danger**, on errors. There is **no brand orange anywhere**.
2. **Icons: `lucide-react`.** WADS' own icon set *is* lucide, but it barrels only ~6 of
   the 18 step-type glyphs needed, so all icons come from `lucide-react` directly — the
   spec mandate, and visually consistent with WADS. (Added as a direct dependency.)
3. **Inline code = WADS `InlineCodeSnippet`** (not a hand-rolled `<code>`), with its text
   recolored from the default syntax color (slate-900) to the trace's **secondary** tone,
   and copy disabled (purely presentational here). See §8.
4. **White surface.** The `InlineCodeSnippet` fill is a very faint slate @ 6% overlay — it
   reads on **white**, not on a light-gray panel — so the chat surface behind the trace is
   white. (On slate-50 the chips wash out.)
5. **Connector rail — the "chain".** A 1px rail threads the icon gutter between live steps,
   and expanded content sits indented under a continuing rail. From the Figma `chain-spacer`.
6. **Animated fold.** When a multi-step run finishes, the summary line emerges and the step
   list **collapses up into it** (a one-shot transition), rather than snapping. See §6.5.
7. **Fold rules** (§7): single step → the row itself; one type only → that type's verb
   ("Thought for 6s", never "Worked"); mixed types → "Worked for {duration}" with `Activity`.
   Collapsed summary shows **time only** — no right-side meta.

---

## 3. Data model (props & types)

```ts
type StepType =
  // reasoning & control flow
  | 'thinking' | 'plan' | 'decision'
  // acting on the world
  | 'subagent' | 'tool' | 'command' | 'web-search' | 'query'
  | 'datastore' | 'api' | 'read' | 'fetch' | 'filter'
  // producing
  | 'create' | 'edit' | 'cite'
  // security (Wally)
  | 'threat-analysis' | 'detection';

type StepStatus = 'pending' | 'active' | 'done' | 'error' | 'skipped';

type ChainDetail =
  | { kind: 'text'; text: string }
  | { kind: 'findings'; items: FindingItem[] }
  | { kind: 'node'; node: React.ReactNode };

interface FindingItem {
  code: string;   // e.g. "ptrav"  -> inline-code chip
  on?: string;    // e.g. "vapi.us.demo.wallarm.tools/api/note" -> inline-code chip
  note?: string;  // e.g. "10,000 hits, blocked" -> plain trailing text
}

interface ChainStep {
  id: string;
  type: StepType;
  status: StepStatus;
  label: string;          // present-continuous while active ("Analyzing…"); past once done ("Analyzed 50 attacks")
  metric?: string;        // optional right-aligned value on the row, e.g. "50"
  detail?: ChainDetail;   // expanded content
  children?: ChainStep[]; // nested steps — DEPTH 2 MAX
}

interface ChainOfThoughtProps {
  steps: ChainStep[];
  running: boolean;          // true while the agent is still working — drives the auto-fold
  durationLabel?: string;    // e.g. "7s" — shown in the folded summary line
  defaultExpanded?: boolean; // override the auto fold/unfold default
  className?: string;
}
```

---

## 4. Type → `lucide-react` icon map

Closed set. All render at **16px**, `color: var(--cot-fg)`.

| StepType | lucide-react | | StepType | lucide-react |
|---|---|---|---|---|
| `thinking` | `Brain` | | `datastore` | `Database` |
| `plan` | `ListChecks` | | `api` | `Plug` |
| `decision` | `GitBranch` | | `read` | `FileText` |
| `subagent` | `Bot` | | `fetch` | `Download` |
| `tool` | `Wrench` | | `filter` | `Filter` |
| `command` | `Terminal` | | `create` | `FilePlus` |
| `web-search` | `Globe` | | `edit` | `Pencil` |
| `query` | `Search` | | `cite` | `Link` |
| `threat-analysis` | `ShieldAlert` | | `detection` | `Radar` |

Structural / state glyphs: summary "Worked" = `Activity`; expand affordance = `ChevronRight`
(rotates 90° → down when open); error = `TriangleAlert` (in danger). Pending & skipped reuse
the **type icon**, dimmed (see §5) — no separate `Circle`/`CircleMinus`.

```ts
const GROUP_VERB: Record<StepType, string> = {
  thinking: 'Thought', plan: 'Planned', decision: 'Decided',
  subagent: 'Delegated', tool: 'Ran tools', command: 'Ran commands',
  'web-search': 'Searched', query: 'Queried', datastore: 'Accessed data',
  api: 'Called APIs', read: 'Read', fetch: 'Fetched', filter: 'Filtered',
  create: 'Created', edit: 'Edited', cite: 'Cited',
  'threat-analysis': 'Analyzed', detection: 'Scanned',
};
```

---

## 5. Glyph precedence & states

One 16px glyph slot per row. Precedence (top rule wins):

1. **Errored** → `TriangleAlert` in danger. Overrides everything.
2. **Collapsible** (summary, or a step with `detail`/`children`) → the **type icon at rest**,
   which **swaps to `ChevronRight` on hover** and **becomes the chevron (rotated, persisting)
   while expanded**. One dynamic slot — never two icons. The whole row is the hover/click target.
3. **Active** → the **type icon** (static); the **label shimmers** (§6.1). No spinner.
4. **Otherwise** → the **type icon** (covers pending · done · skipped, by color/opacity + tense).

| State | Icon | Color | Label |
|---|---|---|---|
| `pending` | type icon | `--cot-fg` @ 40% | future / noun |
| `active` | type icon | `--cot-fg` | **shimmers**, present-continuous |
| `done` | type icon | `--cot-fg` | static, past tense |
| `error` | `TriangleAlert` | `--cot-danger` | past |
| `skipped` | type icon | `--cot-fg` @ 30% | — |

---

## 6. Animations

All durations below are as-built. `@media (prefers-reduced-motion: reduce)` disables the
shimmer (label renders solid `--cot-fg`), the stream-in, the fold, and the summary fade.

### 6.1 Active label — shimmer ("shining text")
A faint band sweeps L→R through the active label. Tight band + ~1.05s loop = noticeable but calm.

```css
.cot-shim {
  background: linear-gradient(90deg,
    var(--cot-fg) 0%, var(--cot-fg) 38%,
    color-mix(in srgb, var(--cot-fg) 12%, transparent) 50%,
    var(--cot-fg) 62%, var(--cot-fg) 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
  animation: cot-shim 1.05s linear infinite;
}
@keyframes cot-shim { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
```

### 6.2 Step entry (stream-in)
Each new step animates in on mount: `cot-in` = `opacity 0→1` + `translateY(4px)→0`, **160ms** ease-out.

### 6.3 Active → done
No layout change. The label swaps from `.cot-shim` to a solid past-tense string; **120ms** opacity cross-fade.

### 6.4 Icon ↔ chevron swap (the single dynamic slot)
Type icon and chevron stack in one 16px box; CSS toggles which is visible on `:hover` and
`[aria-expanded="true"]`; the chevron rotates 90° (150ms) when open. Never crosses a glyph.

### 6.5 Fold (on completion) & expand/collapse
- **Expand / collapse** of any row: animated via `grid-template-rows: 0fr ↔ 1fr` (no height
  measuring) + opacity, **~220ms** ease. Closed content is `inert` (out of tab order / a11y tree).
- **Auto-fold** when `running` flips `true → false` (unless `defaultExpanded`): for multi-step
  runs a one-shot **folding phase** plays — the summary line fades in (`~220ms`) while the finished
  step list **collapses up into it** (`~280ms`), then hands off to the static summary row. Single-step
  runs skip the animation (nothing to collapse). Phase machine: `live → folding → summary`.

---

## 7. Fold / summary logic

While **running**: render the live step list — the active (latest) step shimmers, finished
steps sit above it. **No separate "Working…" row** — the active step *is* the status.

On **done** (`running === false`): auto-fold to one summary row.

```ts
function summarize(steps, duration) {
  if (steps.length === 1) return { kind: 'single', step: steps[0] };   // the row IS the summary, no wrapper
  const types = new Set(steps.map(s => s.type));
  if (types.size === 1) {                                              // homogeneous
    const t = [...types][0];
    return { kind: 'group', icon: t, label: `${GROUP_VERB[t] ?? 'Worked'} for ${duration}` };
  }
  return { kind: 'worked', label: `Worked for ${duration}` };          // heterogeneous → Activity icon
}
```

- **Single step** → just that row (type icon + done label), expandable to its own detail. No "for Ns" wrapper.
- **Homogeneous** (one type) → that type's verb, e.g. "Thought for 6s". *Never* "Worked".
- **Heterogeneous** → "Worked for {duration}" with the `Activity` icon.
- **Collapsed summary shows time only** — the duration lives in the label; no right-side meta.
- **Expanded**: the step list under a connector rail; each step with `detail`/`children` is itself
  collapsible (same slot behavior), nesting **2 deep** max.

---

## 8. Composition & tokens

### Tokens → CSS vars (mapped 1:1 onto WADS theme tokens, so light/dark both adapt)
```css
.cot {
  --cot-fg:       var(--color-icon-secondary);  /* every glyph + label — slate-500 / slate-50@80% (== #62748e) */
  --cot-fg-muted: var(--color-text-tertiary);   /* metrics */
  --cot-rail:     var(--color-border-primary);  /* connector rail (1px) — slate-300 (== #cad5e2) */
  --cot-danger:   var(--color-icon-danger);     /* the only hue in the trace — errors */
  --cot-mono:     var(--font-mono);             /* Geist Mono — metrics */
  font-size: 12px; line-height: 16px;           /* WADS text/xs */
}
```

### Anatomy (from the Figma `409:3812` frame)
- **chain-item** — one 16px-tall row: slot (16px) + 6px gap + label + optional right-aligned `metric` (mono, `--cot-fg-muted`).
- **connector rail** — a 1px line in the icon gutter threading between live steps
  (`.cot-list > .cot-node:not(:last-child)::before`); drawn in the gaps so it never crosses a glyph.
  Expanded content sits indented under a continuing rail (`.cot-rail`, a left border at the parent gutter).
- **Nesting depth: 2 max.**

### Expanded detail
- `findings` → a **bulleted list**, each item a sentence: `• {code}` on `{on}` ` : {note}`.
  `code` and `on` render as WADS **`InlineCodeSnippet`**:
  ```tsx
  import { InlineCodeSnippet } from '@wallarm-org/design-system/CodeSnippet';
  <InlineCodeSnippet code={f.code} size="sm" copyable={false} />
  ```
  Its text color is overridden to `--cot-fg` (the trace's secondary tone — the WADS default is
  slate-900, too dark here). Its faint fill (slate @ 6%) reads on the white surface.
- `text` → a reasoning paragraph (`--cot-fg`, line-height 1.55).
- `node` → caller-supplied React node.

---

## 9. Production wiring (the important part)

- **Stream real steps.** Replace the playground's `useSimulatedRun` with the real agent stream:
  push `ChainStep`s as they start (set `status:'active'`, present-continuous `label`), flip each to
  `status:'done'` with a past-tense `label` when it finishes, then set `running={false}` so the
  component auto-folds. Optionally pass `durationLabel`.
- **White surface.** Render the trace on the white chat surface (the `InlineCodeSnippet` fill is
  designed to read on white). The user message bubble above it uses the light-gray fill for contrast.
- **The answer renders outside** the component, below the trace.
- **`--cot-danger`** is wired to WADS `--color-icon-danger`; it is the only hue and appears only on
  `status:'error'`. (No error fixtures ship in the prototype — confirm the danger token in context.)
- **a11y:** the active step announces via `role="log"` / `aria-live="polite"`; collapsed regions are
  `inert`; reduced-motion is honored.

---

## 10. Integration checklist

- [ ] `<ChainOfThought>` + its CSS dropped in; icons from `lucide-react` per §4.
- [ ] Streaming: active step = type icon + **shimmering** present-continuous label; finished = same icon + static past label.
- [ ] **No separate status row** while running.
- [ ] Auto-fold on `running → false`; multi-step runs collapse into the summary (§6.5).
- [ ] Summary verb correct: homogeneous → type verb; heterogeneous → "Worked for…" (`Activity`); single → the row.
- [ ] Collapsed summary = **time only** (no right-side meta).
- [ ] Single dynamic icon on every collapsible row: type → chevron on hover → rotated while expanded; full-row target.
- [ ] Expand → step list under the rail; nesting **2 deep** max; each detail row independently expandable.
- [ ] Findings render as bulleted `InlineCodeSnippet` chips; chip text = secondary; chips read on the white surface.
- [ ] **Monochrome** — everything `--cot-fg`; only errors use `--cot-danger`; **no orange**.
- [ ] Answer renders **outside** the component.
- [ ] `prefers-reduced-motion: reduce` disables shimmer / entry / fold.
- [ ] Light & dark both adapt (all colors via WADS tokens).

---

## 11. Reference

**Prototype source** — `src/components/chain-of-thought/`:
```
index.ts                 # the component surface (what lifts out)
chain-of-thought.tsx     # orchestrator: live list → folding → summary (phase machine)
chain-step.tsx           # a row + its (recursive, depth-2) detail/children
chain-summary.tsx        # summarize() + the folded summary row
detail.tsx               # findings (InlineCodeSnippet) / paragraph / node renderer
glyph.tsx                # Slot (icon↔chevron) + Collapsible (grid-rows + inert)
icons.ts                 # StepType → lucide map + GROUP_VERB + SUMMARY_ICON
types.ts                 # the types in §3
use-fold-state.ts        # auto-fold + expand/collapse state
chain-of-thought.css     # tokens (§8) + animations (§6) + connector
use-simulated-run.ts     # PLAYGROUND ONLY — fakes the agent stream
fixtures.ts              # PLAYGROUND ONLY — 3 scenarios, real Wallarm attack data
```
Route: `src/app/chain-of-thought/page.tsx` (the playground — scenario picker + Replay; none of it ships).

**Figma:** `Wally — AI Assistant`, file key `bsqgrzkpIB2yPVlNpgU8jN`, nodes `409:3812` (Layout) & `494:4292` (dark ui).
The chat chrome in those frames (header, input bar, mesh background, user bubble) is **context only** —
this component is the trace increment, not the full chat.
