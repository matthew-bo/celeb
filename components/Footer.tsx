"use client";

/**
 * Footer Component
 * 
 * Minimal footer with attribution.
 * Reference: README.md §4 - Footer (tiny)
 */

export function Footer() {
  return (
    <footer className="py-6 px-4 text-center border-t border-zinc-100 dark:border-zinc-800">
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Images via{" "}
        <a 
          href="https://www.themoviedb.org/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          TMDB
        </a>
        {" · "}
        No data stored
      </p>
    </footer>
  );
}

