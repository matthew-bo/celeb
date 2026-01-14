"use client";

/**
 * RecommendationCard Component
 *
 * Full costume recommendation card with:
 * - Reference image (2:3 aspect ratio)
 * - Title + difficulty badge
 * - "Why it matches" bullets
 * - Anchor item + shopping list
 * - Substitutions + warnings
 *
 * Reference: README.md §7 Results Requirements
 */

import { useState } from "react";
import Image from "next/image";
import type { Recommendation } from "@/lib/schema";
import { ChevronDown, ChevronUp, Check, AlertTriangle, Heart } from "./icons";

interface RecommendationCardProps {
  recommendation: Recommendation;
  isSelected?: boolean;
  onMoreLikeThis: () => void;
  index: number;
  compact?: boolean;
}

export function RecommendationCard({
  recommendation,
  isSelected = false,
  onMoreLikeThis,
  index,
  compact = false,
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [imageError, setImageError] = useState(false);

  const {
    title,
    image,
    whyItMatches,
    difficulty,
    anchorItem,
    shoppingList,
    substitutions,
    warnings,
  } = recommendation;

  // Difficulty badge colors
  const difficultyStyles = {
    Easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  // Animation delay based on index
  const animationDelay = `${index * 100}ms`;

  return (
    <article
      className={`
        w-full rounded-2xl overflow-hidden
        bg-white dark:bg-zinc-900
        border-2 transition-all duration-200
        ${isSelected
          ? "border-accent shadow-lg"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
        }
        animate-fade-in
      `}
      style={{ animationDelay }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image section - 2:3 aspect ratio preserved on all screens */}
        <div className="relative w-full sm:w-48 aspect-[2/3] shrink-0 bg-zinc-100 dark:bg-zinc-800">
          {image?.url && !imageError ? (
            <Image
              src={image.url}
              alt={`${title} costume reference`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 192px"
              onError={() => setImageError(true)}
              priority={index === 0}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 p-4">
              <svg
                className="w-12 h-12 mb-2"
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
              <span className="text-xs text-center">Reference image unavailable</span>
            </div>
          )}

          {/* Difficulty badge overlay */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${difficultyStyles[difficulty]}`}
            >
              {difficulty}
            </span>
          </div>
        </div>

        {/* Content section */}
        <div className="flex-1 p-4 sm:p-5">
          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {title}
          </h3>

          {/* Why it matches */}
          <div className="mb-3">
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1.5">
              Why this slaps
            </h4>
            <ul className="space-y-1">
              {whyItMatches.map((reason, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                >
                  <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Anchor item highlight */}
          <div className="mb-3 p-2.5 rounded-lg bg-accent/5 dark:bg-accent/10 border border-accent/20">
            <div className="text-xs font-medium uppercase tracking-wide text-accent mb-0.5">
              The key piece
            </div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {anchorItem}
            </div>
          </div>

          {/* Expandable shopping list */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-left group"
            >
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                Shopping list ({shoppingList.length} items)
              </span>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-4 animate-fade-in">
                {/* Shopping list */}
                <ul className="space-y-2">
                  {shoppingList.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400"
                    >
                      <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-500">
                        {idx + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Substitutions */}
                {substitutions && substitutions.length > 0 && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
                      Substitutions
                    </h5>
                    <ul className="space-y-1">
                      {substitutions.map((sub, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-zinc-500 dark:text-zinc-400 italic"
                        >
                          • {sub}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {warnings && warnings.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    {warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200"
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* More like this button */}
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={onMoreLikeThis}
              className={`
                flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl
                text-sm font-medium transition-all
                ${isSelected
                  ? "bg-accent text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }
              `}
            >
              <Heart className="w-4 h-4" />
              More like this
            </button>
          </div>
        </div>
      </div>

      {/* Attribution */}
      {image?.attributionText && (
        <div className="px-5 pb-3 text-xs text-zinc-400 dark:text-zinc-600">
          {image.attributionLink ? (
            <a
              href={image.attributionLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-600 dark:hover:text-zinc-400"
            >
              Image: {image.attributionText}
            </a>
          ) : (
            <span>Image: {image.attributionText}</span>
          )}
        </div>
      )}
    </article>
  );
}

