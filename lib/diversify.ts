/**
 * Diversity Rules
 *
 * Reference: README.md §6.3 Candidate shortlist
 * Ensures variety in recommendations.
 */

import type { ScoredCostume } from "./score";

/**
 * Ensure diversity in candidate list.
 * At least 2 different archetypeTags among top 10 if possible.
 */
export function ensureDiversity(
  candidates: ScoredCostume[],
  minArchetypes: number = 2
): ScoredCostume[] {
  if (candidates.length <= 3) {
    return candidates;
  }

  // Get archetype coverage of current top 10
  const top10 = candidates.slice(0, 10);
  const archetypesInTop10 = new Set<string>();

  for (const costume of top10) {
    for (const tag of costume.similarity.archetypeTags) {
      archetypesInTop10.add(tag);
    }
  }

  // If we already have enough diversity, return as-is
  if (archetypesInTop10.size >= minArchetypes) {
    return candidates;
  }

  // Try to promote candidates with different archetypes
  const result = [...top10];
  const remainingCandidates = candidates.slice(10);

  for (const candidate of remainingCandidates) {
    const newArchetypes = candidate.similarity.archetypeTags.filter(
      (tag) => !archetypesInTop10.has(tag)
    );

    if (newArchetypes.length > 0) {
      // This candidate adds diversity - promote it
      result.splice(9, 0, candidate); // Insert before position 10
      for (const tag of newArchetypes) {
        archetypesInTop10.add(tag);
      }

      if (archetypesInTop10.size >= minArchetypes) {
        break;
      }
    }
  }

  // Add remaining candidates
  const includedIds = new Set(result.map((c) => c.id));
  for (const candidate of remainingCandidates) {
    if (!includedIds.has(candidate.id)) {
      result.push(candidate);
    }
  }

  return result;
}

/**
 * Ensure universe diversity when user selected "Surprise me"
 */
export function ensureUniverseDiversity(
  candidates: ScoredCostume[],
  universes: string[]
): ScoredCostume[] {
  // Only apply if user selected all universes or none (surprise me)
  if (universes.length > 0 && universes.length < 5) {
    return candidates;
  }

  if (candidates.length <= 3) {
    return candidates;
  }

  // Check universe distribution in top 3
  const top3Universes = candidates.slice(0, 3).map((c) => c.universe);
  const uniqueUniverses = new Set(top3Universes);

  if (uniqueUniverses.size >= 2) {
    return candidates; // Already diverse enough
  }

  // Try to swap in a candidate from a different universe
  const dominantUniverse = top3Universes[0];
  const remaining = candidates.slice(3);

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].universe !== dominantUniverse) {
      // Swap this candidate into position 3
      const result = [...candidates];
      const [swapped] = result.splice(3 + i, 1);
      result.splice(2, 0, swapped);
      return result;
    }
  }

  return candidates;
}

