"use client";

/**
 * ResultsGrid Component
 *
 * Displays the 3 costume recommendations in a responsive grid.
 * Reference: README.md §7 Results Requirements
 */

import { useState, useRef, useEffect } from "react";
import type { Recommendation, RecommendResponse, QuizResponse } from "@/lib/schema";
import { RecommendationCard } from "./RecommendationCard";
import { RefineBar } from "./RefineBar";
import { MoreLikeThisResults } from "./MoreLikeThisResults";
import { Sparkles, RefreshCw } from "./icons";

// Map goal keys to display labels
const GOAL_LABELS: Record<string, string> = {
  funny: "Funny",
  sexy: "Sexy",
  stylish: "Stylish",
  clever: "Clever",
  lowEffortHighPayoff: "Low effort",
};

// Map effort to display labels
const EFFORT_LABELS: Record<string, string> = {
  one_item: "One item",
  few_fast: "Quick pieces",
  some_work: "Some effort",
  suffer_for_bit: "Full commit",
};

// Map universe to display labels
const UNIVERSE_LABELS: Record<string, string> = {
  movie: "Movies",
  tv: "TV",
  music: "Music",
  sports: "Sports",
  internet: "Internet",
};

interface ResultsGridProps {
  recommendations: Recommendation[];
  meta?: RecommendResponse["meta"] | null;
  quiz: QuizResponse;
  onReset: () => void;
  onMoreLikeThis: (
    costumeId: string,
    direction?: string
  ) => Promise<Recommendation[] | null>;
  shownCostumeIds: string[];
}

export function ResultsGrid({
  recommendations,
  meta,
  quiz,
  onReset,
  onMoreLikeThis,
  shownCostumeIds,
}: ResultsGridProps) {
  const [selectedCostume, setSelectedCostume] = useState<Recommendation | null>(null);
  const [moreLikeThisResults, setMoreLikeThisResults] = useState<Recommendation[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [moreLikeThisError, setMoreLikeThisError] = useState<string | null>(null);
  
  // Ref for scrolling to "more like this" results
  const moreLikeThisRef = useRef<HTMLDivElement>(null);
  
  // Scroll to "more like this" section when results appear
  useEffect(() => {
    if (moreLikeThisResults.length > 0 && moreLikeThisRef.current) {
      moreLikeThisRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [moreLikeThisResults]);

  // Handle "More like this" on a specific card
  const handleMoreLikeThis = async (costume: Recommendation) => {
    setSelectedCostume(costume);
    setIsLoadingMore(true);
    setMoreLikeThisError(null);

    try {
      const results = await onMoreLikeThis(costume.costumeId);
      if (results) {
        setMoreLikeThisResults(results);
      } else {
        setMoreLikeThisError("Couldn't find similar costumes. Try a different one.");
      }
    } catch {
      setMoreLikeThisError("Something went wrong. Try again.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle direction refinement
  const handleDirectionRefine = async (direction: string) => {
    if (!selectedCostume) {
      // If no costume selected, use the first one
      const firstCostume = recommendations[0];
      if (firstCostume) {
        setSelectedCostume(firstCostume);
        setIsLoadingMore(true);
        setMoreLikeThisError(null);

        try {
          const results = await onMoreLikeThis(firstCostume.costumeId, direction);
          if (results) {
            setMoreLikeThisResults(results);
          } else {
            setMoreLikeThisError("No costumes found for that direction.");
          }
        } catch {
          setMoreLikeThisError("Something went wrong. Try again.");
        } finally {
          setIsLoadingMore(false);
        }
      }
    } else {
      // Use already selected costume
      setIsLoadingMore(true);
      setMoreLikeThisError(null);

      try {
        const results = await onMoreLikeThis(selectedCostume.costumeId, direction);
        if (results) {
          setMoreLikeThisResults(results);
        } else {
          setMoreLikeThisError("No costumes found for that direction.");
        }
      } catch {
        setMoreLikeThisError("Something went wrong. Try again.");
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  // Clear more like this results
  const handleClearMoreLikeThis = () => {
    setSelectedCostume(null);
    setMoreLikeThisResults([]);
    setMoreLikeThisError(null);
  };

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 py-8 max-w-4xl mx-auto animate-fade-in">
      {/* Success header */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-3">
        <Sparkles className="w-4 h-4" />
        <span>
          {meta?.mode === "fallback" ? "Done. You're welcome." : "Nailed it."}
        </span>
      </div>

      {/* Main headline */}
      <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-2">
        Here&apos;s what we got
      </h2>
      <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 text-center mb-4 max-w-sm">
        Tap "more like this" on any card if you want options.
      </p>
      
      {/* Quiz summary badges - show user what they selected */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {quiz.goals.map((goal) => (
          <span
            key={goal}
            className="px-3 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent border border-accent/20"
          >
            {GOAL_LABELS[goal] || goal}
          </span>
        ))}
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          {EFFORT_LABELS[quiz.effort] || quiz.effort}
        </span>
        {quiz.universes.slice(0, 2).map((universe) => (
          <span
            key={universe}
            className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          >
            {UNIVERSE_LABELS[universe] || universe}
          </span>
        ))}
        {quiz.universes.length > 2 && (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            +{quiz.universes.length - 2} more
          </span>
        )}
      </div>

      {/* Relaxation message if applicable */}
      {meta?.relaxationsApplied && meta.relaxationsApplied.length > 0 && (
        <div className="w-full max-w-sm mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 text-center">
            Your standards were... ambitious. We loosened: {meta.relaxationsApplied.join(", ")}
          </p>
        </div>
      )}

      {/* Recommendation cards */}
      <div className="w-full grid gap-6 mb-8">
        {recommendations.map((rec, idx) => (
          <RecommendationCard
            key={rec.costumeId}
            recommendation={rec}
            isSelected={selectedCostume?.costumeId === rec.costumeId}
            onMoreLikeThis={() => handleMoreLikeThis(rec)}
            index={idx}
            rank={idx + 1}
          />
        ))}
      </div>

      {/* Refinement bar */}
      <RefineBar
        onDirection={handleDirectionRefine}
        onReset={onReset}
        isLoading={isLoadingMore}
      />

      {/* More Like This results section */}
      {(moreLikeThisResults.length > 0 || isLoadingMore || moreLikeThisError) && (
        <div ref={moreLikeThisRef}>
          <MoreLikeThisResults
            results={moreLikeThisResults}
            isLoading={isLoadingMore}
            error={moreLikeThisError}
            selectedTitle={selectedCostume?.title}
            onClear={handleClearMoreLikeThis}
            onMoreLikeThis={handleMoreLikeThis}
          />
        </div>
      )}

      {/* Retake quiz button at bottom */}
      <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 w-full flex flex-col items-center gap-3">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-4 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-base font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors touch-manipulation min-h-[56px]"
        >
          <RefreshCw className="w-5 h-5" />
          Take Quiz Again
        </button>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Not feeling it? Different answers = different costumes.
        </p>
      </div>
    </div>
  );
}

