# chat-design

Clickable prototype for the **Wally AI assistant chat background** — an animated
*liquid mesh gradient* (six soft color blobs drifting behind one large blur, on
co-prime loops so it never visibly repeats). Sibling to `auth-design`; same
Next.js 16 + WADS chassis. Discussion artifact, not production.

**Live:** https://artem-desing.github.io/chat-design/

## Routes
- `/` — prototype hub
- `/chat-background/final` — the gradient at full strength (ship view)
- `/chat-background/tune` — playground: 9:16 preview + blur / speed / opacity / freeze controls

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # static export to out/
```

(pnpm only — see `CLAUDE.md`.)

## Handoff to engineering
- **[docs/chat-background-handoff.md](docs/chat-background-handoff.md)** — developer handoff for lifting the gradient into the real Wally app (as-built values, the white base, production opacity wiring, Figma source).

The gradient component lives in `src/components/chat-background/` (`liquid-gradient.tsx` + `liquid-gradient.css`) and is plain CSS with no framework deps, so it lifts out cleanly. Prototype only — mock data, no real auth/API.
