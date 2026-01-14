/**
 * LLM Provider Wrapper
 *
 * Reference: README.md §7 AI Integration
 * Abstracts OpenAI integration for recommendation generation.
 */

import OpenAI from "openai";
import type { Costume, QuizResponse, Recommendation } from "./schema";
import { buildPrompt, containsForbiddenPhrases } from "./prompts";
import { applyHardFilters } from "./filter";

// Lazy initialization
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// LLM response schema for structured output
type LLMRecommendation = {
  costumeId: string;
  whyItMatches: string[];
  shoppingList: string[];
  substitutions?: string[];
  warnings?: string[];
};

type LLMResponse = {
  recommendations: [LLMRecommendation, LLMRecommendation, LLMRecommendation];
};

/**
 * Call LLM to select and describe top 3 recommendations
 *
 * Reference: README.md §10 - Latency budget (6-8s timeout)
 */
export async function generateRecommendations(
  quiz: QuizResponse,
  candidates: Costume[]
): Promise<LLMResponse> {
  const openai = getOpenAI();
  const { systemPrompt, userPrompt } = buildPrompt(quiz, candidates);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const response = await openai.chat.completions.create(
      {
        model: process.env.OPENAI_MODEL || "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty LLM response");
    }

    // Parse and validate
    const parsed = JSON.parse(content) as LLMResponse;

    // Validate structure
    if (
      !parsed.recommendations ||
      !Array.isArray(parsed.recommendations) ||
      parsed.recommendations.length !== 3
    ) {
      throw new Error("Invalid recommendation count");
    }

    // Build lookup maps
    const candidateIds = new Set(candidates.map((c) => c.id));
    const candidateMap = new Map(candidates.map((c) => [c.id, c]));

    for (const rec of parsed.recommendations) {
      // Validate costume ID exists in candidates
      if (!candidateIds.has(rec.costumeId)) {
        throw new Error(`Invalid costume ID: ${rec.costumeId}`);
      }

      // Validate whyItMatches count (2-3 bullets per README §7)
      if (!rec.whyItMatches || rec.whyItMatches.length < 2 || rec.whyItMatches.length > 3) {
        throw new Error(`Invalid whyItMatches count for ${rec.costumeId}: expected 2-3, got ${rec.whyItMatches?.length || 0}`);
      }

      // Validate shoppingList count (3-7 items per README §4.3)
      if (!rec.shoppingList || rec.shoppingList.length < 3 || rec.shoppingList.length > 7) {
        throw new Error(`Invalid shoppingList count for ${rec.costumeId}: expected 3-7, got ${rec.shoppingList?.length || 0}`);
      }

      // Check for forbidden phrases
      const allText = [
        ...rec.whyItMatches,
        ...rec.shoppingList,
        ...(rec.substitutions || []),
        ...(rec.warnings || []),
      ].join(" ");

      if (containsForbiddenPhrases(allText)) {
        throw new Error("Response contains forbidden AI phrases");
      }
    }

    // Post-generation boundary verification (belt + suspenders per README §7.3)
    const selectedCostumes = parsed.recommendations.map((r) => candidateMap.get(r.costumeId)!);
    const validCostumes = applyHardFilters(selectedCostumes, quiz);
    
    if (validCostumes.length !== 3) {
      const invalidIds = selectedCostumes
        .filter((c) => !validCostumes.some((v) => v.id === c.id))
        .map((c) => c.id);
      throw new Error(`LLM selected costumes that violate boundaries: ${invalidIds.join(", ")}`);
    }

    return parsed;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Enrich LLM recommendations with costume data
 */
export function enrichRecommendations(
  llmRecs: LLMResponse["recommendations"],
  candidates: Costume[]
): Array<Omit<Recommendation, "image">> {
  const costumeMap = new Map(candidates.map((c) => [c.id, c]));

  return llmRecs.map((rec) => {
    const costume = costumeMap.get(rec.costumeId)!;

    // Determine difficulty based on effort
    const difficultyMap: Record<string, "Easy" | "Medium" | "Hard"> = {
      one_item: "Easy",
      few_fast: "Easy",
      some_work: "Medium",
      suffer_for_bit: "Hard",
    };

    return {
      costumeId: rec.costumeId,
      title: costume.displayTitle,
      whyItMatches: rec.whyItMatches,
      difficulty: difficultyMap[costume.constraints.effort] || "Medium",
      anchorItem: costume.requirements.anchorItem,
      shoppingList: rec.shoppingList,
      substitutions: rec.substitutions,
      warnings: rec.warnings,
      similarityTags: [
        ...costume.similarity.archetypeTags,
        ...costume.similarity.vibeTags,
      ],
    };
  });
}

