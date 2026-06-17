import Link from 'next/link';
import { Button } from '@wallarm-org/design-system/Button';
import { ChatBackground } from '@/components/chat-background';

/**
 * The final view: exactly what ships behind the real chat — the animated ambient
 * field with the shipped defaults, an empty panel standing in for the chat UI,
 * and no tuning controls. Follows the system theme automatically via the
 * theme-aware --chat-bg-* tokens.
 */
export default function ChatBackgroundFinal() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[var(--chat-bg-base)]">
      <ChatBackground />

      {/* Empty chat panel — stands in for the real chat surface. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-24">
        <div className="pointer-events-auto h-[80vh] w-full max-w-3xl rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-surface-1)] shadow-xl" />
      </div>

      {/* Back to the prototypes hub. */}
      <div className="absolute left-16 top-16 z-50">
        <Link href="/">
          <Button variant="outline" color="neutral">
            ← All prototypes
          </Button>
        </Link>
      </div>
    </main>
  );
}
