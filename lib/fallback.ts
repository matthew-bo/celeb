/**
 * Fallback Generator
 *
 * Reference: README.md §7.4, §11
 * Template-based recommendation output when LLM fails.
 */

import type { Costume, QuizResponse, Recommendation } from "./schema";
import type { ScoredCostume } from "./score";

/**
 * "Why it matches" template variants
 * Reference: README.md §11 - need 10-15 variants
 */
const WHY_TEMPLATES = {
  lowEffort: [
    "One piece does the heavy lifting here.",
    "Minimal effort, maximum recognition.",
    "The lazy genius move.",
    "You wanted easy—this delivers.",
  ],
  stylish: [
    "Stylish enough to wear outside Halloween.",
    "This reads fashion, not costume.",
    "The kind of look that just works.",
    "Sharp without trying too hard.",
  ],
  funny: [
    "Gets laughs without explanation.",
    "The bit commits itself.",
    "Comedy through recognition.",
    "Funny to everyone, not just your friends.",
  ],
  clever: [
    "For the people who get it.",
    "A reference that rewards the audience.",
    "Smart without being insufferable.",
    "The nod-and-smile costume.",
  ],
  sexy: [
    "This one's for the attention.",
    "Hot in a way that makes sense.",
    "Confidence is the main accessory.",
    "Looks good, knows it.",
  ],
  niche: [
    "Deep cut for the devoted.",
    "Only the real ones will know.",
    "Not for the casual viewer.",
  ],
  recognizable: [
    "Instant recognition, zero explanation.",
    "Everyone gets this one.",
    "The crowd-pleaser.",
  ],
  budgetFriendly: [
    "Easy on the wallet.",
    "Most of this is already in your closet.",
    "Budget-friendly without looking cheap.",
  ],
  barFriendly: [
    "Survives a crowded bar.",
    "Durable enough for a long night.",
    "Won't fall apart by midnight.",
  ],
};

/**
 * Pick random item from array
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate "why it matches" bullets based on costume and quiz
 */
function generateWhyItMatches(
  costume: Costume,
  quiz: QuizResponse
): string[] {
  const bullets: string[] = [];

  // Add vibe-based bullet
  for (const goal of quiz.goals) {
    const vibeKey = goal === "lowEffortHighPayoff" ? "lowEffort" : goal;
    if (WHY_TEMPLATES[vibeKey as keyof typeof WHY_TEMPLATES]) {
      bullets.push(
        pickRandom(WHY_TEMPLATES[vibeKey as keyof typeof WHY_TEMPLATES])
      );
      break;
    }
  }

  // Add niche-based bullet
  if (costume.nicheScore <= 2) {
    bullets.push(pickRandom(WHY_TEMPLATES.recognizable));
  } else if (costume.nicheScore >= 6) {
    bullets.push(pickRandom(WHY_TEMPLATES.niche));
  }

  // Add practical bullet if relevant
  if (costume.constraints.budget === "lt_30" || costume.constraints.budget === "30_75") {
    bullets.push(pickRandom(WHY_TEMPLATES.budgetFriendly));
  } else if (costume.constraints.barFriendly && quiz.practical.mustSurviveCrowdedBar) {
    bullets.push(pickRandom(WHY_TEMPLATES.barFriendly));
  }

  // Ensure we have 2-3 bullets
  if (bullets.length < 2) {
    bullets.push(pickRandom(WHY_TEMPLATES.stylish));
  }

  return bullets.slice(0, 3);
}

/**
 * Determine difficulty from effort constraint
 */
function getDifficulty(effort: Costume["constraints"]["effort"]): "Easy" | "Medium" | "Hard" {
  switch (effort) {
    case "one_item":
    case "few_fast":
      return "Easy";
    case "some_work":
      return "Medium";
    case "suffer_for_bit":
      return "Hard";
    default:
      return "Medium";
  }
}

/**
 * Generate fallback recommendation for a costume
 */
export function generateFallbackRecommendation(
  costume: Costume,
  quiz: QuizResponse
): Omit<Recommendation, "image"> {
  return {
    costumeId: costume.id,
    title: costume.displayTitle,
    whyItMatches: generateWhyItMatches(costume, quiz),
    difficulty: getDifficulty(costume.constraints.effort),
    anchorItem: costume.requirements.anchorItem,
    shoppingList: costume.requirements.items.slice(0, 7),
    substitutions: undefined,
    warnings: costume.requiresBodyPaintOrFullFacePaint
      ? ["This needs body/face paint—commit or skip."]
      : undefined,
    similarityTags: [
      ...costume.similarity.archetypeTags,
      ...costume.similarity.vibeTags,
    ],
  };
}

/**
 * Generate fallback recommendations from scored candidates
 */
export function generateFallbackRecommendations(
  candidates: ScoredCostume[],
  quiz: QuizResponse
): [
  Omit<Recommendation, "image">,
  Omit<Recommendation, "image">,
  Omit<Recommendation, "image">
] {
  const top3 = candidates.slice(0, 3);

  if (top3.length < 3) {
    throw new Error("Not enough candidates for fallback");
  }

  return [
    generateFallbackRecommendation(top3[0], quiz),
    generateFallbackRecommendation(top3[1], quiz),
    generateFallbackRecommendation(top3[2], quiz),
  ];
}

