/**
 * Diversity Rules
 *
 * Ensures variety in recommendations.
 * Includes ensuring at least 1 funny/extreme option.
 * Adds randomization to prevent same costumes appearing repeatedly.
 */

import type { ScoredCostume } from "./score";

/**
 * Fisher-Yates shuffle for arrays
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Add controlled randomization to candidate list.
 * Shuffles candidates within score "buckets" to add variety
 * while respecting relative ranking.
 */
export function addRandomShuffle(
  candidates: ScoredCostume[],
  bucketSize: number = 5
): ScoredCostume[] {
  if (candidates.length <= 3) {
    return candidates;
  }

  const result: ScoredCostume[] = [];
  
  // Process in buckets (e.g., positions 0-4, 5-9, 10-14, etc.)
  for (let i = 0; i < candidates.length; i += bucketSize) {
    const bucket = candidates.slice(i, i + bucketSize);
    const shuffled = shuffleArray(bucket);
    result.push(...shuffled);
  }

  return result;
}

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

/**
 * Ensure at least 1 funny/extreme costume in top 3.
 * If none exist in top 3, RANDOMLY select from top funnyExtreme candidates.
 * This ensures variety - different absurd costumes show up each time.
 */
export function ensureFunnyExtreme(
  candidates: ScoredCostume[]
): ScoredCostume[] {
  if (candidates.length <= 3) {
    return candidates;
  }

  // Check if top 3 already has a funnyExtreme
  const top3 = candidates.slice(0, 3);
  const hasFunnyExtreme = top3.some((c) => c.funnyExtreme);

  if (hasFunnyExtreme) {
    return candidates; // Already have one
  }

  // Find ALL funnyExtreme costumes outside top 3
  const remaining = candidates.slice(3);
  const funnyExtremeIndices: number[] = [];
  
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].funnyExtreme) {
      funnyExtremeIndices.push(i);
    }
  }

  if (funnyExtremeIndices.length === 0) {
    return candidates; // No funnyExtreme costumes available
  }

  // Pick randomly from the top 10 funnyExtreme candidates (or all if less than 10)
  // This ensures variety while still favoring higher-scoring absurd costumes
  const topAbsurdCount = Math.min(10, funnyExtremeIndices.length);
  const topAbsurdIndices = funnyExtremeIndices.slice(0, topAbsurdCount);
  const randomIndex = topAbsurdIndices[Math.floor(Math.random() * topAbsurdIndices.length)];

  // Swap the randomly selected funnyExtreme into position 3
  const result = [...candidates];
  const [funnyCandidate] = result.splice(3 + randomIndex, 1);
  result.splice(2, 0, funnyCandidate); // Insert at position 3

  return result;
}

