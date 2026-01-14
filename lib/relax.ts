/**
 * Relaxation Ladder
 *
 * Reference: README.md §2 - What happens when filters are too restrictive
 * Progressively relaxes constraints to ensure results.
 */

import type { Costume, QuizResponse } from "./schema";
import { applyHardFilters } from "./filter";

export type RelaxationResult = {
  costumes: Costume[];
  relaxationsApplied: string[];
};

/**
 * Create a relaxed copy of quiz response
 */
function relaxQuiz(
  quiz: QuizResponse,
  relaxations: string[]
): QuizResponse {
  const relaxed = JSON.parse(JSON.stringify(quiz)) as QuizResponse;

  for (const relaxation of relaxations) {
    switch (relaxation) {
      case "era":
        relaxed.era = "any";
        break;
      case "universe":
        relaxed.universes = []; // Empty = all universes
        break;
      case "budget": {
        const budgetOrder = ["lt_30", "30_75", "75_150", "dont_care"] as const;
        const currentBudgetIndex = budgetOrder.indexOf(relaxed.budget);
        if (currentBudgetIndex < budgetOrder.length - 1) {
          relaxed.budget = budgetOrder[currentBudgetIndex + 1];
        }
        break;
      }
      case "effort": {
        const effortOrder = ["one_item", "few_fast", "some_work", "suffer_for_bit"] as const;
        const currentEffortIndex = effortOrder.indexOf(relaxed.effort);
        if (currentEffortIndex < effortOrder.length - 1) {
          relaxed.effort = effortOrder[currentEffortIndex + 1];
        }
        break;
      }
    }
  }

  return relaxed;
}

/**
 * Apply relaxation ladder to get enough results.
 * 
 * Relaxation order:
 * 1. Keep boundaries STRICT (never relax)
 * 2. Relax era → soft preference
 * 3. Expand universe
 * 4. Relax budget up one tier
 * 5. Relax effort up one tier
 */
export function applyRelaxationLadder(
  allCostumes: Costume[],
  quiz: QuizResponse,
  minResults: number = 5
): RelaxationResult {
  const relaxationSteps = ["era", "universe", "budget", "effort"];
  const appliedRelaxations: string[] = [];

  // Start with hard filters only
  let filtered = applyHardFilters(allCostumes, quiz);

  if (filtered.length >= minResults) {
    return { costumes: filtered, relaxationsApplied: [] };
  }

  // Apply relaxations one by one
  for (const step of relaxationSteps) {
    appliedRelaxations.push(step);
    const relaxedQuiz = relaxQuiz(quiz, appliedRelaxations);
    filtered = applyHardFilters(allCostumes, relaxedQuiz);

    if (filtered.length >= minResults) {
      return { costumes: filtered, relaxationsApplied: appliedRelaxations };
    }
  }

  // Even after all relaxations, return what we have
  return { costumes: filtered, relaxationsApplied: appliedRelaxations };
}

/**
 * Format relaxation message for user display
 */
export function formatRelaxationMessage(relaxations: string[]): string | null {
  if (relaxations.length === 0) return null;

  const parts = relaxations.map((r) => {
    switch (r) {
      case "era":
        return "Era";
      case "universe":
        return "Universe";
      case "budget":
        return "Budget";
      case "effort":
        return "Effort";
      default:
        return r;
    }
  });

  return `You made this *hard* (respect). We widened: ${parts.join(" + ")}.`;
}

