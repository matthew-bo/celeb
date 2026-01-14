"use client";

/**
 * MoreLikeThisResults Component
 *
 * Displays the 5 similar costume results below the main recommendations.
 * Reference: README.md §4 (Refinement asymmetry - 5 results for more like this)
 */

import Image from "next/image";
import { useState } from "react";
import type { Recommendation } from "@/lib/schema";
import { X, Check, ChevronDown, ChevronUp, AlertTriangle, Heart } from "./icons";

interface MoreLikeThisResultsProps {
  results: Recommendation[];
  isLoading: boolean;
  error: string | null;
  selectedTitle?: string;
  onClear: () => void;
  onMoreLikeThis?: (costume: Recommendation) => void;
}

export function MoreLikeThisResults({
  results,
  isLoading,
  error,
  selectedTitle,
  onClear,
  onMoreLikeThis,
}: MoreLikeThisResultsProps) {
  const resultCount = results.length || 5; // Show 5 during loading
  
  return (
    <div className="w-full mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 animate-fade-in">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {selectedTitle ? `More "${selectedTitle}" vibes` : "Similar picks"}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {isLoading 
              ? "Hold on..." 
              : `${resultCount} more ${resultCount === 1 ? "option" : "options"}`
            }
          </p>
        </div>
        <button
          onClick={onClear}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          aria-label="Clear similar results"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(5)].map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="aspect-[3/2] skeleton" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 skeleton rounded" />
                <div className="h-4 w-1/2 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-center">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Results grid */}
      {!isLoading && !error && results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((rec, idx) => (
            <CompactCard 
              key={rec.costumeId} 
              recommendation={rec} 
              index={idx}
              onMoreLikeThis={onMoreLikeThis ? () => onMoreLikeThis(rec) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact recommendation card for "More like this" results
 */
interface CompactCardProps {
  recommendation: Recommendation;
  index: number;
  onMoreLikeThis?: () => void;
}

function CompactCard({ recommendation, index, onMoreLikeThis }: CompactCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    title,
    image,
    whyItMatches,
    difficulty,
    anchorItem,
    shoppingList,
    warnings,
  } = recommendation;

  const difficultyStyles = {
    Easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <article
      className="rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[3/2] bg-zinc-100 dark:bg-zinc-800">
        {image?.url && !imageError ? (
          <Image
            src={image.url}
            alt={`${title} costume reference`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-600">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Difficulty badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${difficultyStyles[difficulty]}`}
          >
            {difficulty}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 break-words">
          {title}
        </h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">
          {whyItMatches[0]}
        </p>

        {/* Anchor item */}
        <div className="text-xs mb-3">
          <span className="text-zinc-400 dark:text-zinc-500">Anchor: </span>
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">
            {anchorItem}
          </span>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show shopping list
            </>
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2 animate-fade-in">
            <ul className="space-y-1">
              {shoppingList.slice(0, 5).map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400"
                >
                  <Check className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
              {shoppingList.length > 5 && (
                <li className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                  +{shoppingList.length - 5} more items
                </li>
              )}
            </ul>

            {warnings && warnings.length > 0 && (
              <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                {warnings[0]}
              </div>
            )}
          </div>
        )}
        
        {/* More like this button for deeper exploration */}
        {onMoreLikeThis && (
          <button
            onClick={onMoreLikeThis}
            className="mt-3 flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-accent transition-colors"
          >
            <Heart className="w-3 h-3" />
            More like this
          </button>
        )}
      </div>
    </article>
  );
}

