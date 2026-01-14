/**
 * Hard Constraint Filtering
 *
 * Applies hard constraints BEFORE LLM is called.
 * Note: Safety filters and universe filtering removed per design decision.
 */

import type { Costume, QuizResponse } from "./schema";

/**
 * Filter costumes by hard constraints from quiz boundaries.
 * Returns only costumes that pass ALL hard constraints.
 */
export function filterByConstraints(
  costumes: Costume[],
  quiz: QuizResponse
): Costume[] {
  return costumes.filter((costume) => {
    // Wig requirement filter
    if (quiz.boundaries.avoidWigs && costume.requirements.wigRequired) {
      return false;
    }

    // Face paint filter (includes body paint)
    if (
      quiz.boundaries.avoidFacePaint &&
      (costume.requirements.facePaintRequired ||
        costume.requiresBodyPaintOrFullFacePaint)
    ) {
      return false;
    }

    // Era filter - soft in scoring, but can be used as hard filter if needed
    // Currently treating as soft per relaxation ladder

    return true;
  });
}

/**
 * Apply practical constraint filters
 */
export function filterByPractical(
  costumes: Costume[],
  quiz: QuizResponse
): Costume[] {
  return costumes.filter((costume) => {
    // Bar friendly requirement
    if (quiz.practical.mustSurviveCrowdedBar && !costume.constraints.barFriendly) {
      return false;
    }

    // Pockets requirement
    if (quiz.practical.needsPockets && !costume.constraints.pocketsLikely) {
      return false;
    }

    // Comfort requirement
    if (
      quiz.practical.mustBeComfortable &&
      costume.constraints.comfort === "low"
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Main filter function combining all hard constraints
 */
export function applyHardFilters(
  costumes: Costume[],
  quiz: QuizResponse
): Costume[] {
  let filtered = filterByConstraints(costumes, quiz);
  filtered = filterByPractical(filtered, quiz);
  return filtered;
}

