import Link from 'next/link';

interface Card {
  href: string;
  title: string;
  route: string;
  badge?: string;
  badgeTone?: 'success' | 'info';
  description: string;
}

interface Section {
  label: string;
  blurb: string;
  cards: Card[];
}

const SECTIONS: Section[] = [
  {
    label: 'Chat background',
    blurb:
      'The Wally AI assistant’s ambient backdrop — a liquid mesh gradient: six soft color blobs drifting behind one big blur, on co-prime loops so it never visibly repeats.',
    cards: [
      {
        href: '/chat-background/final',
        title: 'Final animation',
        route: '/chat-background/final',
        badge: 'Final',
        badgeTone: 'success',
        description:
          'The mesh gradient at full strength in a 9:16 phone frame — exactly the drift that ships behind the chat, at the spec defaults. No controls.',
      },
      {
        href: '/chat-background/tune',
        title: 'Animation with adjustments',
        route: '/chat-background/tune',
        description:
          'The same gradient with the tuner — blur, speed, opacity and a freeze toggle for grabbing a still.',
      },
    ],
  },
  {
    label: 'Chain of thought',
    blurb:
      'How Wally’s reasoning surfaces in the chat — the animation and transitions of the chain-of-thought stream as it thinks. Motion studies and examples live here.',
    cards: [
      {
        href: '/chain-of-thought',
        title: 'Explore examples',
        route: '/chain-of-thought',
        badge: 'WIP',
        badgeTone: 'info',
        description:
          'A playground for chain-of-thought animation and transitions. Scaffolded and empty for now — the prototype lands here next.',
      },
    ],
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-32 px-24 py-48">
      <header className="flex flex-col gap-8">
        <p className="text-sm font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase">
          Wallarm — Chat
        </p>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Prototypes
        </h1>
        <p className="max-w-2xl text-[var(--color-text-secondary)]">
          Chat surface prototypes in one place — the background animation and Wally’s
          chain of thought. Each card opens a live demo; use “← All prototypes” inside
          any view to come back here.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.label} className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase">
              {section.label}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">{section.blurb}</p>
          </div>

          <div className="flex flex-col gap-12">
            {section.cards.map((v) => (
              <Link
                key={v.href}
                href={v.href}
                className="group flex items-center justify-between gap-16 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-surface-1)] px-24 py-20 transition-colors hover:bg-[var(--color-bg-light-primary)]"
              >
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-12">
                    <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                      {v.title}
                    </span>
                    <code className="text-xs text-[var(--color-text-tertiary)]">{v.route}</code>
                    {v.badge && (
                      <span
                        className={`rounded-full px-8 py-2 text-xs font-medium ${
                          v.badgeTone === 'info'
                            ? 'bg-[var(--color-bg-light-info)] text-[var(--color-text-info)]'
                            : 'bg-[var(--color-bg-light-success)] text-[var(--color-text-success)]'
                        }`}
                      >
                        {v.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">{v.description}</p>
                </div>
                <span
                  aria-hidden
                  className="text-xl text-[var(--color-text-tertiary)] transition-transform group-hover:translate-x-2"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
