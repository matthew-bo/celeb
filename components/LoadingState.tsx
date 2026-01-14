"use client";

/**
 * LoadingState Component
 * 
 * Calm skeleton loading state with personality.
 * No spinners, no "AI thinking" energy.
 */

import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "Judging your choices...",
  "Consulting the costume gods...",
  "Ignoring the boring options...",
  "Finding looks that won't embarrass you...",
  "Eliminating anything cringe...",
];

export function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-5 animate-fade-in">
      {/* Headline */}
      <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 text-center mb-3">
        One sec...
      </h2>
      
      {/* Rotating message */}
      <p className="text-base text-zinc-500 dark:text-zinc-400 text-center mb-10 h-6 transition-opacity">
        {LOADING_MESSAGES[messageIndex]}
      </p>

      {/* Skeleton cards */}
      <div className="w-full max-w-sm space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            style={{ opacity: 1 - (i * 0.2) }}
          >
            {/* Image skeleton */}
            <div className="w-16 h-20 rounded-lg skeleton shrink-0" />
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-3/4 rounded skeleton" />
              <div className="h-3 w-1/2 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Subtext */}
      <p className="mt-8 text-xs text-zinc-400 dark:text-zinc-500 text-center">
        Usually takes ~3 seconds. Patience is a virtue.
      </p>
    </div>
  );
}
