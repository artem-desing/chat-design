import Link from 'next/link';
import { Button } from '@wallarm-org/design-system/Button';
import { LiquidGradient } from '@/components/chat-background';

/**
 * The final view: the Wally liquid mesh gradient at full strength in a 9:16
 * phone-proportioned frame — exactly the drift that ships behind the chat,
 * with the spec defaults (blur 62, speed 1, opacity 1) and no controls.
 */
export default function ChatBackgroundFinal() {
  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center bg-[var(--color-bg-page-bg)] p-24">
      <div className="w-full" style={{ maxWidth: 360 }}>
        <LiquidGradient />
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
