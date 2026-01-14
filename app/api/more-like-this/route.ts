/**
 * POST /api/more-like-this
 *
 * Reference: README.md §8.2
 * Returns 5 similar costumes based on selected costume.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  MoreLikeThisRequestSchema,
  type MoreLikeThisResponse,
  type QuizResponse,
} from "@/lib/schema";
import { applyHardFilters } from "@/lib/filter";
import { scoreAndRank } from "@/lib/score";
import { generateFallbackRecommendation } from "@/lib/fallback";
import { resolveImageWithFallback } from "@/lib/images";
import { loadDataset } from "@/lib/dataset";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Apply direction adjustments to quiz
 */
function applyDirection(
  quiz: QuizResponse,
  direction?: string
): QuizResponse {
  const adjusted = JSON.parse(JSON.stringify(quiz)) as QuizResponse;

  switch (direction) {
    case "more_recognizable":
      adjusted.nicheTarget = Math.max(1, adjusted.nicheTarget - 2) as QuizResponse["nicheTarget"];
      break;
    case "weirder":
      adjusted.nicheTarget = Math.min(7, adjusted.nicheTarget + 2) as QuizResponse["nicheTarget"];
      break;
    case "easier":
      const effortOrder = ["one_item", "few_fast", "some_work", "suffer_for_bit"] as const;
      const currentIndex = effortOrder.indexOf(adjusted.effort);
      if (currentIndex > 0) {
        adjusted.effort = effortOrder[currentIndex - 1];
      }
      break;
    case "hotter":
      // Will be handled in scoring via goal weights
      if (!adjusted.goals.includes("sexy")) {
        adjusted.goals = [...adjusted.goals.slice(0, 1), "sexy"];
      }
      break;
    case "stylisher":
      if (!adjusted.goals.includes("stylish")) {
        adjusted.goals = [...adjusted.goals.slice(0, 1), "stylish"];
      }
      break;
  }

  return adjusted;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimitResult = await checkRateLimit(ip, "more-like-this");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const requestResult = MoreLikeThisRequestSchema.safeParse(body);

    if (!requestResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: requestResult.error.flatten() },
        { status: 400 }
      );
    }

    const { selectedCostumeId, quiz, direction, excludeIds = [] } = requestResult.data;

    // Load dataset
    const { costumes } = loadDataset();

    // Find selected costume
    const selectedCostume = costumes.find((c) => c.id === selectedCostumeId);
    if (!selectedCostume) {
      return NextResponse.json(
        { error: "Selected costume not found" },
        { status: 404 }
      );
    }

    // Apply direction adjustments
    const adjustedQuiz = applyDirection(quiz, direction);

    // Filter and score
    let filtered = applyHardFilters(costumes, adjustedQuiz);

    // Exclude already shown costumes
    const excludeSet = new Set([selectedCostumeId, ...excludeIds]);
    filtered = filtered.filter((c) => !excludeSet.has(c.id));

    // Boost costumes with similar tags
    const selectedTags = new Set([
      ...selectedCostume.similarity.archetypeTags,
      ...selectedCostume.similarity.vibeTags,
    ]);

    // Score with similarity boost
    const scored = scoreAndRank(filtered, adjustedQuiz, 50).map((costume) => {
      const matchingTags = [
        ...costume.similarity.archetypeTags,
        ...costume.similarity.vibeTags,
      ].filter((tag) => selectedTags.has(tag)).length;

      return {
        ...costume,
        score: costume.score + matchingTags * 0.5,
      };
    });

    // Re-sort and take top 5
    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5);

    // Need at least 1 result
    if (top5.length === 0) {
      return NextResponse.json(
        { error: "No similar costumes found. Try different constraints." },
        { status: 404 }
      );
    }
    
    // Return whatever we found (1-5 results) - frontend handles partial results

    // Generate recommendations
    const recommendations = await Promise.all(
      top5.map(async (costume) => {
        const rec = generateFallbackRecommendation(costume, adjustedQuiz);
        const image = await resolveImageWithFallback(
          costume.images.primary,
          costume.images.alternatives
        );
        return { ...rec, image };
      })
    );

    const response: MoreLikeThisResponse = {
      recommendations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("More like this error:", error);
    return NextResponse.json(
      { error: "Failed to find similar costumes" },
      { status: 500 }
    );
  }
}

