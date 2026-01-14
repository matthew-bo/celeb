"use client";

/**
 * Hero Component
 * 
 * Punchy landing - get users into the quiz fast.
 * Mobile-first, minimal text.
 */

interface HeroProps {
  onStart: () => void;
}

export function Hero({ onStart }: HeroProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-5 text-center bg-texture">
      {/* Headline - bold, to the point */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1] max-w-sm sm:max-w-lg">
        You need a costume.
        <br />
        <span className="text-accent">We&apos;ve got opinions.</span>
      </h1>

      {/* CTA - big thumb target */}
      <button
        onClick={onStart}
        className="mt-10 px-8 py-4 sm:px-10 sm:py-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-base sm:text-lg font-semibold transition-all duration-200 min-h-[56px] hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] touch-manipulation"
      >
        Let&apos;s do this
      </button>
    </div>
  );
}
