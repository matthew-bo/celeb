/**
 * POST /api/recommend
 *
 * Reference: README.md §8.1
 * Main recommendation endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { QuizResponseSchema, type RecommendResponse } from "@/lib/schema";
import { scoreAndRank } from "@/lib/score";
import { ensureDiversity, ensureUniverseDiversity, ensureFunnyExtreme, addRandomShuffle } from "@/lib/diversify";
import { applyRelaxationLadder } from "@/lib/relax";
import { generateRecommendations, enrichRecommendations } from "@/lib/llm";
import { generateFallbackRecommendations } from "@/lib/fallback";
import { resolveImageWithFallback } from "@/lib/images";
import { loadDataset } from "@/lib/dataset";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimitResult = await checkRateLimit(ip, "recommend");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const quizResult = QuizResponseSchema.safeParse(body);

    if (!quizResult.success) {
      return NextResponse.json(
        { error: "Invalid quiz response", details: quizResult.error.flatten() },
        { status: 400 }
      );
    }

    const quiz = quizResult.data;

    // Load dataset
    const { costumes, version } = loadDataset();

    // Apply relaxation ladder if needed
    const { costumes: filtered, relaxationsApplied } = applyRelaxationLadder(
      costumes,
      quiz,
      5
    );

    if (filtered.length === 0) {
      return NextResponse.json(
        { error: "No costumes match your criteria. Try loosening some constraints." },
        { status: 404 }
      );
    }

    // Score and rank - get more candidates for shuffling variety
    let candidates = scoreAndRank(filtered, quiz, 30);

    // Add randomization within score buckets for variety
    candidates = addRandomShuffle(candidates, 5);
    
    // Apply diversity rules
    candidates = ensureDiversity(candidates);
    candidates = ensureUniverseDiversity(candidates, quiz.universes);
    candidates = ensureFunnyExtreme(candidates);
    
    // Trim back to top 20 for LLM
    candidates = candidates.slice(0, 20);

    // Try LLM generation, fall back to deterministic
    let mode: "llm" | "fallback" = "llm";
    let recommendations: Awaited<ReturnType<typeof enrichRecommendations>>;

    try {
      const llmResponse = await generateRecommendations(quiz, candidates);
      recommendations = enrichRecommendations(llmResponse.recommendations, candidates);
    } catch (error) {
      console.error("LLM generation failed, using fallback:", error);
      mode = "fallback";
      recommendations = generateFallbackRecommendations(candidates, quiz);
    }

    // Resolve images
    const costumeMap = new Map(candidates.map((c) => [c.id, c]));
    const withImages = await Promise.all(
      recommendations.map(async (rec) => {
        const costume = costumeMap.get(rec.costumeId)!;
        const image = await resolveImageWithFallback(
          costume.images.primary,
          costume.images.alternatives
        );
        return { ...rec, image };
      })
    );

    const response: RecommendResponse = {
      recommendations: [withImages[0], withImages[1], withImages[2]],
      meta: {
        datasetVersion: version,
        mode,
        relaxationsApplied: relaxationsApplied.length > 0 ? relaxationsApplied : undefined,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

