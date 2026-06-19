# chat-design

Clickable prototypes for the **Wally AI assistant chat** — the animated *liquid mesh
gradient* chat background, and the **chain-of-thought** process trace (the reasoning
steps that stream in, then fold into one summary line). Sibling to `auth-design`; same
Next.js 16 + WADS chassis. Discussion artifact, not production.

**Live:** https://artem-desing.github.io/chat-design/

## Routes
- `/` — prototype hub
- `/chat-background/final` — the gradient at full strength (ship view)
- `/chat-background/tune` — playground: 9:16 preview + blur / speed / opacity / freeze controls
- `/chain-of-thought` — chain-of-thought playground: scenario toggles (mixed / thinking-only / single) + Replay

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # static export to out/
```

(pnpm only — see `CLAUDE.md`.)

## Handoff to engineering
- **[docs/chat-background-handoff.md](docs/chat-background-handoff.md)** — developer handoff for lifting the gradient into the real Wally app (as-built values, the white base, production opacity wiring, Figma source).
- **[docs/chain-of-thought-handoff.md](docs/chain-of-thought-handoff.md)** — component spec & developer handoff for the `<ChainOfThought>` trace (data model, icon map, fold rules, animations, tokens, Figma source).

The gradient lives in `src/components/chat-background/` (`liquid-gradient.tsx` + `liquid-gradient.css`) and the trace in `src/components/chain-of-thought/` — both plain CSS with minimal deps, so they lift out cleanly. Prototype only — mock data, no real auth/API.
