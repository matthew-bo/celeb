"use client";

/**
 * RefineBar Component
 *
 * Refinement controls for adjusting recommendations:
 * - More recognizable / Weirder (niche adjustment)
 * - Easier (effort adjustment)
 * - Hotter / Stylish-er (vibe boosts)
 * - Restart
 *
 * Reference: README.md §7 Refinement Controls
 */

import {
  Target,
  Sparkles,
  Zap,
  Flame,
  Crown,
  RefreshCw,
} from "./icons";

interface RefineBarProps {
  onDirection: (direction: string) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function RefineBar({ onDirection, onReset, isLoading = false }: RefineBarProps) {
  const buttons = [
    {
      id: "more_recognizable",
      label: "More basic",
      icon: Target,
      description: "Normies will understand",
    },
    {
      id: "weirder",
      label: "Weirder",
      icon: Sparkles,
      description: "For the cultured few",
    },
    {
      id: "easier",
      label: "Lazier",
      icon: Zap,
      description: "Minimal effort mode",
    },
    {
      id: "hotter",
      label: "Hotter",
      icon: Flame,
      description: "Main character energy",
    },
    {
      id: "stylisher",
      label: "More drip",
      icon: Crown,
      description: "Fashion over function",
    },
  ];

  return (
    <div className="w-full max-w-2xl">
      {/* Section header */}
      <div className="text-center mb-4">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Not quite it? Tweak the vibe:
        </h3>
      </div>

      {/* Button grid */}
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3"
        role="group"
        aria-label="Refinement options"
      >
        {buttons.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            onClick={() => onDirection(id)}
            disabled={isLoading}
            aria-label={`${label}: ${description}`}
            title={description}
            className={`
              flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl
              bg-zinc-100 dark:bg-zinc-800
              hover:bg-zinc-200 dark:hover:bg-zinc-700
              focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
              active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
              group
            `}
          >
            <Icon
              className={`
                w-5 h-5
                text-zinc-500 dark:text-zinc-400
                group-hover:text-accent
                transition-colors
              `}
            />
            <span className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center leading-tight">
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Finding more...
          </div>
        </div>
      )}
    </div>
  );
}

