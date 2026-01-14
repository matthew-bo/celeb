"use client";

/**
 * Main Page
 *
 * Single-page quiz flow with hero, quiz, and results.
 * Reference: README.md §4 Information Architecture - single route.
 */

import { useState, useCallback, useRef } from "react";
import { Quiz } from "@/components/Quiz";
import { Footer } from "@/components/Footer";
import type {
  QuizResponse,
  Recommendation,
  RecommendResponse,
  MoreLikeThisResponse,
} from "@/lib/schema";

type AppState = "quiz" | "loading" | "results" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("quiz");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [meta, setMeta] = useState<RecommendResponse["meta"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shownCostumeIds, setShownCostumeIds] = useState<string[]>([]);

  // Store quiz response for more-like-this calls
  const quizRef = useRef<QuizResponse | null>(null);

  const handleSubmit = useCallback(async (quiz: QuizResponse) => {
    setAppState("loading");
    setError(null);
    quizRef.current = quiz;

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get recommendations");
      }

      const data: RecommendResponse = await response.json();
      setRecommendations(data.recommendations);
      setMeta(data.meta);
      setAppState("results");

      // Track shown costume IDs
      const newIds = data.recommendations.map((r) => r.costumeId);
      setShownCostumeIds((prev) => [...new Set([...prev, ...newIds])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAppState("error");
    }
  }, []);

  const handleMoreLikeThis = useCallback(
    async (
      costumeId: string,
      direction?: string
    ): Promise<Recommendation[] | null> => {
      if (!quizRef.current) return null;

      try {
        const response = await fetch("/api/more-like-this", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedCostumeId: costumeId,
            quiz: quizRef.current,
            direction,
            excludeIds: shownCostumeIds,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("More like this failed:", errorData);
          return null;
        }

        const data: MoreLikeThisResponse = await response.json();

        // Track shown costume IDs
        const newIds = data.recommendations.map((r) => r.costumeId);
        setShownCostumeIds((prev) => [...new Set([...prev, ...newIds])]);

        return data.recommendations;
      } catch (err) {
        console.error("More like this error:", err);
        return null;
      }
    },
    [shownCostumeIds]
  );

  const handleReset = useCallback(() => {
    setRecommendations([]);
    setMeta(null);
    setError(null);
    setShownCostumeIds([]);
    quizRef.current = null;
    setAppState("quiz");
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setAppState("quiz");
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <Quiz
          onSubmit={handleSubmit}
          appState={appState}
          recommendations={recommendations}
          meta={meta}
          onReset={handleReset}
          onMoreLikeThis={handleMoreLikeThis}
          shownCostumeIds={shownCostumeIds}
        />
      </div>

      {/* Error toast */}
      {error && appState === "error" && (
        <div className="fixed bottom-20 left-4 right-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl shadow-lg">
          <p className="text-red-700 dark:text-red-300 text-center font-medium">
            {error}
          </p>
          <div className="flex gap-3 justify-center mt-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
            >
              Try again
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      )}

      {/* Footer - only show when not in quiz flow */}
      {appState === "results" && <Footer />}
    </div>
  );
}
