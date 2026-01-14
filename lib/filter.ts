/**
 * Hard Constraint Filtering
 *
 * Reference: README.md §6.1 Deterministic filter
 * Applies hard constraints BEFORE LLM is called.
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
    // Safety boundary filters
    if (
      quiz.boundaries.avoidCultureSpecific &&
      costume.safety.cultureSpecific
    ) {
      return false;
    }

    if (quiz.boundaries.avoidReligious && costume.safety.religiousAttire) {
      return false;
    }

    if (quiz.boundaries.avoidPolitical && costume.safety.politicalFigure) {
      return false;
    }

    if (quiz.boundaries.avoidControversial && costume.safety.controversial) {
      return false;
    }

    // Skin tone change is always excluded if boundary is set (default ON)
    if (
      quiz.boundaries.noSkinToneChange &&
      costume.safety.skinToneChangeImplied
    ) {
      return false;
    }

    // Wig requirement filter
    if (quiz.boundaries.avoidWigs && costume.requirements.wigRequired) {
      return false;
    }

    // Face paint filter (includes body paint per §18)
    if (
      quiz.boundaries.avoidFacePaint &&
      (costume.requirements.facePaintRequired ||
        costume.requiresBodyPaintOrFullFacePaint)
    ) {
      return false;
    }

    // Universe filter (unless "Surprise me" - empty array or all selected)
    if (
      quiz.universes.length > 0 &&
      quiz.universes.length < 5 &&
      !quiz.universes.includes(costume.universe)
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

