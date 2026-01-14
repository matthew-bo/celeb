"use client";

/**
 * ResultsPlaceholder Component
 * 
 * Temporary placeholder for Phase 7 results UI.
 * Shows that recommendations were received successfully.
 */

import type { Recommendation, RecommendResponse } from "@/lib/schema";
import { RefreshCw, Sparkles } from "./icons";

interface ResultsPlaceholderProps {
  recommendations: Recommendation[];
  meta?: RecommendResponse["meta"] | null;
  onReset: () => void;
}

export function ResultsPlaceholder({ 
  recommendations, 
  meta,
  onReset 
}: ResultsPlaceholderProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 max-w-2xl mx-auto">
      {/* Success header */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
        <Sparkles className="w-4 h-4" />
        <span>
          {meta?.mode === "fallback" ? "Quick picks ready" : "Your looks are ready"}
        </span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-8">
        {recommendations.length} costumes found
      </h2>

      {/* Relaxation message if applicable */}
      {meta?.relaxationsApplied && meta.relaxationsApplied.length > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
            You made this <em>hard</em>. We widened: {meta.relaxationsApplied.join(", ")}
          </p>
        </div>
      )}

      {/* Preview cards */}
      <div className="w-full space-y-4 mb-8">
        {recommendations.map((rec, idx) => (
          <div
            key={rec.costumeId}
            className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            {/* Image placeholder */}
            <div className="w-20 h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden">
              {rec.image?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={rec.image.url}
                  alt={rec.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {rec.title}
                </h3>
                <span className={`
                  shrink-0 px-2 py-0.5 text-xs font-medium rounded-full
                  ${rec.difficulty === "Easy" 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : rec.difficulty === "Medium"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }
                `}>
                  {rec.difficulty}
                </span>
              </div>
              
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {rec.whyItMatches[0]}
              </p>
              
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                Anchor: {rec.anchorItem}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Phase 7 notice */}
      <div className="text-center mb-8 p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Full results UI with shopping lists and refinement controls coming in Phase 7
        </p>
      </div>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-6 py-3 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Start over
      </button>
    </div>
  );
}

