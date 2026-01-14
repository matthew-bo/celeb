/**
 * Scoring Engine
 *
 * Reference: README.md §6.2 Scoring (soft constraints)
 * Calculates weighted scores for costume ranking.
 */

import type { Costume, QuizResponse } from "./schema";

export type ScoredCostume = Costume & { score: number };

// Weight configuration
const WEIGHTS = {
  vibeMatch: 3.0,
  nicheMatch: 2.0,
  effortMatch: 1.5,
  budgetMatch: 1.5,
  genderMatch: 1.0,
  practicalBonus: 1.0,
  resemblanceMatch: 1.0,
  closetBooster: 0.5,
  photoCues: 0.5,
  eraMatch: 0.5,
  // New photo-based weights
  celebrityMatch: 5.0,  // Huge boost for looking like the celebrity
  skinToneMatch: 1.5,   // Helpful for matching
  ageRangeMatch: 1.0,   // Character age should match
  vibeKeywordMatch: 1.0, // Aesthetic alignment
};

/**
 * Calculate vibe match score based on selected goals
 */
function scoreVibes(costume: Costume, goals: QuizResponse["goals"]): number {
  let score = 0;
  const vibeMap: Record<string, keyof Costume["vibes"]> = {
    funny: "funny",
    sexy: "sexy",
    stylish: "stylish",
    clever: "clever",
    lowEffortHighPayoff: "lowEffortHighPayoff",
  };

  for (const goal of goals) {
    const vibeKey = vibeMap[goal];
    if (vibeKey) {
      // 0-3 scale, normalize to 0-1
      score += costume.vibes[vibeKey] / 3;
    }
  }

  // Normalize by number of goals selected
  return score / goals.length;
}

/**
 * Calculate niche match score
 * Score = 1 - abs(nicheScore - nicheTarget) / 6
 * (Using 6 as max difference for 1-7 scale)
 */
function scoreNiche(costume: Costume, nicheTarget: number): number {
  const diff = Math.abs(costume.nicheScore - nicheTarget);
  return 1 - diff / 6;
}

/**
 * Calculate effort match score
 */
function scoreEffort(
  costume: Costume,
  effort: QuizResponse["effort"]
): number {
  const effortOrder = ["one_item", "few_fast", "some_work", "suffer_for_bit"];
  const userIndex = effortOrder.indexOf(effort);
  const costumeIndex = effortOrder.indexOf(costume.constraints.effort);

  if (costumeIndex <= userIndex) {
    // Costume effort is at or below user's tolerance
    return 1.0;
  } else if (costumeIndex === userIndex + 1) {
    // One level above - partial penalty
    return 0.5;
  }
  // More than one level above - significant penalty
  return 0.1;
}

/**
 * Calculate budget match score
 */
function scoreBudget(
  costume: Costume,
  budget: QuizResponse["budget"]
): number {
  // User doesn't care about budget - everything matches
  if (budget === "dont_care") return 1.0;
  
  // Costume works for any budget - always matches
  if (costume.constraints.budget === "dont_care") return 1.0;

  const budgetOrder = ["lt_30", "30_75", "75_150"];
  const userIndex = budgetOrder.indexOf(budget);
  const costumeIndex = budgetOrder.indexOf(costume.constraints.budget);

  if (costumeIndex <= userIndex) {
    return 1.0;
  } else if (costumeIndex === userIndex + 1) {
    return 0.5;
  }
  return 0.1;
}

/**
 * Calculate practical constraint bonus
 */
function scorePractical(costume: Costume, quiz: QuizResponse): number {
  let bonus = 0;
  let factors = 0;

  if (quiz.practical.mustBeComfortable) {
    factors++;
    if (costume.constraints.comfort === "high") bonus += 1;
    else if (costume.constraints.comfort === "medium") bonus += 0.5;
  }

  if (quiz.practical.mustSurviveCrowdedBar) {
    factors++;
    if (costume.constraints.barFriendly) bonus += 1;
  }

  if (quiz.practical.needsPockets) {
    factors++;
    if (costume.constraints.pocketsLikely) bonus += 1;
  }

  return factors > 0 ? bonus / factors : 0;
}

/**
 * Calculate closet booster score
 */
function scoreClosetBoosters(
  costume: Costume,
  closetBoosters?: QuizResponse["closetBoosters"]
): number {
  if (!closetBoosters) return 0;

  const itemKeywords: Record<string, string[]> = {
    hasLeatherJacket: ["leather", "jacket", "biker"],
    hasSunglasses: ["sunglasses", "shades", "glasses"],
    hasSuit: ["suit", "blazer", "formal"],
    hasBoots: ["boots", "boot"],
    hasDress: ["dress", "gown"],
    hasBlazer: ["blazer", "jacket"],
  };

  let matches = 0;
  let totalBoosters = 0;

  for (const [key, keywords] of Object.entries(itemKeywords)) {
    if (closetBoosters[key as keyof typeof closetBoosters]) {
      totalBoosters++;
      const allItems = [
        costume.requirements.anchorItem.toLowerCase(),
        ...costume.requirements.items.map((i) => i.toLowerCase()),
        ...costume.similarity.archetypeTags.map((t) => t.toLowerCase()),
      ].join(" ");

      if (keywords.some((kw) => allItems.includes(kw))) {
        matches++;
      }
    }
  }

  return totalBoosters > 0 ? matches / totalBoosters : 0;
}

/**
 * Calculate era match score
 */
function scoreEra(costume: Costume, era: QuizResponse["era"]): number {
  if (era === "any" || costume.era === "any") return 1.0;
  return costume.era === era ? 1.0 : 0.5;
}

/**
 * Calculate gender presentation match score
 * Reference: README.md §Q5 - Gender presentation preference
 */
function scoreGenderPresentation(
  costume: Costume,
  genderPref: QuizResponse["genderPref"],
  userPresentation?: "masc" | "femme" | "androgynous"
): number {
  // Don't care = everything matches
  if (genderPref === "dont_care") return 1.0;
  
  // Flexible costumes work for anyone
  if (costume.genderPresentation === "flexible") return 1.0;
  if (costume.genderPresentation === "androgynous") return 0.9;
  
  // Without knowing user's presentation, we can't match
  // In v1, we use photo cues or treat as neutral
  if (!userPresentation) return 0.7;
  
  if (genderPref === "match") {
    return costume.genderPresentation === userPresentation ? 1.0 : 0.3;
  } else {
    // dont_match - cross-gender costume
    return costume.genderPresentation !== userPresentation ? 1.0 : 0.3;
  }
}

/**
 * Calculate resemblance match score
 * Reference: README.md §Q6 - Look-alike vs vibe slider
 * 
 * resemblanceTarget: 1 = "Just the vibe" — 7 = "Double take"
 * Low resemblance target → prefer costumes that don't require exact look
 * High resemblance target → prefer costumes where looking like the character matters
 */
function scoreResemblance(
  costume: Costume,
  resemblanceTarget: number,
  photoCues?: QuizResponse["photoCues"]
): number {
  // Low resemblance (1-3): User wants "just the vibe"
  // - Favor costumes that work without wigs, heavy makeup, or exact look
  // High resemblance (5-7): User wants "double take"
  // - Favor costumes where matching the character's look is achievable
  
  const lowResemblance = resemblanceTarget <= 3;
  const highResemblance = resemblanceTarget >= 5;
  
  if (lowResemblance) {
    // Prefer costumes that don't require wigs or heavy transformation
    let score = 1.0;
    if (costume.requirements.wigRequired) score -= 0.3;
    if (costume.requirements.makeupLevel === "heavy") score -= 0.2;
    if (costume.requirements.facePaintRequired) score -= 0.3;
    if (costume.requiresBodyPaintOrFullFacePaint) score -= 0.3;
    return Math.max(0, score);
  }
  
  if (highResemblance) {
    // For high resemblance, check if user's attributes match costume needs
    let score = 0.5; // Base score
    
    // If we have photo cues, use them to determine match quality
    if (photoCues) {
      // Glasses match
      const costumeNeedsGlasses = [
        costume.requirements.anchorItem.toLowerCase(),
        ...costume.requirements.items.map(i => i.toLowerCase()),
        ...costume.similarity.archetypeTags,
      ].some(s => s.includes("glasses") || s.includes("shades"));
      
      if (costumeNeedsGlasses && photoCues.glassesLikely) {
        score += 0.2; // User already has glasses
      }
      
      // Hair considerations
      if (!costume.requirements.wigRequired) {
        score += 0.2; // No wig needed = easier to match
      } else if (photoCues.hairLength !== "unknown") {
        score += 0.1; // Wig required but we know user's hair
      }
    } else {
      // No photo cues - give neutral score to costumes
      // Slight preference for costumes that don't require exact matching
      if (!costume.requirements.wigRequired) score += 0.2;
    }
    
    return Math.min(1.0, score);
  }
  
  // Middle range (4): neutral
  return 0.7;
}

/**
 * Calculate photo cues match score (basic features)
 * Boosts costumes that match user's physical attributes
 */
function scorePhotoCues(
  costume: Costume,
  photoCues?: QuizResponse["photoCues"]
): number {
  if (!photoCues) return 0;
  
  let score = 0;
  let factors = 0;
  
  // If user has glasses and costume involves sunglasses, boost
  if (photoCues.glassesLikely) {
    factors++;
    const hasGlassesItem = [
      costume.requirements.anchorItem.toLowerCase(),
      ...costume.requirements.items.map(i => i.toLowerCase()),
      ...costume.similarity.archetypeTags,
    ].some(s => s.includes("glasses") || s.includes("shades"));
    
    if (hasGlassesItem) score += 1;
  }
  
  // Hair color match - if we can determine it
  if (photoCues.hairColor && photoCues.hairColor !== "unknown") {
    factors++;
    // Check if costume notes or tags mention hair color
    const costumeText = [
      costume.notes || "",
      ...costume.similarity.archetypeTags,
      ...costume.similarity.vibeTags,
    ].join(" ").toLowerCase();
    
    if (costumeText.includes(photoCues.hairColor)) {
      score += 1;
    } else if (!costume.requirements.wigRequired) {
      score += 0.5; // No wig required, so hair color doesn't matter as much
    }
  }
  
  // Wig requirement vs user's hair
  if (costume.requirements.wigRequired && photoCues.hairLength !== "unknown") {
    factors++;
    score += 0.3; // Partial score - wig might still work
  } else if (!costume.requirements.wigRequired) {
    factors++;
    score += 1; // No wig needed = easier
  }
  
  return factors > 0 ? score / factors : 0;
}

/**
 * Calculate celebrity match score - THE BIG ONE
 * Gives huge boost to costumes of celebrities the user resembles
 */
function scoreCelebrityMatch(
  costume: Costume,
  photoCues?: QuizResponse["photoCues"]
): number {
  if (!photoCues?.celebrityMatches || photoCues.celebrityMatches.length === 0) {
    return 0;
  }
  
  // Get the celebrity names from matches
  const matchedCelebs = photoCues.celebrityMatches.map(m => m.name.toLowerCase());
  
  // Check if costume is of a matched celebrity
  const costumeName = costume.name.toLowerCase();
  const costumeTitle = costume.displayTitle.toLowerCase();
  const costumeSource = (costume.sourceTitle || "").toLowerCase();
  
  for (const match of photoCues.celebrityMatches) {
    const celebName = match.name.toLowerCase();
    const celebParts = celebName.split(" ");
    
    // Direct name match
    if (costumeName.includes(celebName) || costumeTitle.includes(celebName)) {
      // This is a costume OF the celebrity they look like!
      return match.confidence === "high" ? 1.0 : 
             match.confidence === "medium" ? 0.8 : 0.6;
    }
    
    // Check for actor's roles - if costume is played by that actor
    // e.g., user looks like Keanu Reeves → boost Neo, John Wick
    // This is done by checking similarity tags and notes
    const costumeMetadata = [
      costume.notes || "",
      ...costume.similarity.archetypeTags,
      ...costume.similarity.vibeTags,
    ].join(" ").toLowerCase();
    
    // Check if any part of celeb name appears (for "Chris Evans" → "evans")
    for (const part of celebParts) {
      if (part.length > 3 && costumeMetadata.includes(part)) {
        return match.confidence === "high" ? 0.7 : 0.5;
      }
    }
  }
  
  // No direct celebrity match, but check for similar "types"
  // e.g., matched celebs have similar vibes to the costume character
  const matchNotes = photoCues.celebrityMatches
    .map(m => m.notes || "")
    .join(" ")
    .toLowerCase();
  
  const costumeVibeTags = costume.similarity.vibeTags.map(t => t.toLowerCase());
  let vibeOverlap = 0;
  for (const tag of costumeVibeTags) {
    if (matchNotes.includes(tag)) vibeOverlap++;
  }
  
  if (vibeOverlap > 0) {
    return 0.3 * Math.min(vibeOverlap / 2, 1);
  }
  
  return 0;
}

/**
 * Calculate skin tone match score
 * Helps with realistic character matching
 */
function scoreSkinTone(
  costume: Costume,
  photoCues?: QuizResponse["photoCues"]
): number {
  if (!photoCues?.skinTone || photoCues.skinTone === "unknown") {
    return 0;
  }
  
  // Check costume notes and tags for skin tone hints
  const costumeMetadata = [
    costume.notes || "",
    ...costume.similarity.archetypeTags,
  ].join(" ").toLowerCase();
  
  // Define skin tone groupings for matching
  const lightTones = ["very_light", "light"];
  const mediumTones = ["medium", "olive", "tan"];
  const darkTones = ["brown", "dark"];
  
  const userToneGroup = lightTones.includes(photoCues.skinTone) ? "light" :
                        mediumTones.includes(photoCues.skinTone) ? "medium" : "dark";
  
  // Look for indicators in costume metadata
  // This is a rough heuristic - ideally costumes would have this data
  if (costumeMetadata.includes("any skin") || costumeMetadata.includes("universal")) {
    return 0.8;
  }
  
  // Default: neutral score, slight preference for versatile costumes
  return 0.5;
}

/**
 * Calculate age range match score
 */
function scoreAgeRange(
  costume: Costume,
  photoCues?: QuizResponse["photoCues"]
): number {
  if (!photoCues?.ageRange || photoCues.ageRange === "unknown") {
    return 0;
  }
  
  // Check if costume is for a specific age
  const costumeMetadata = [
    costume.notes || "",
    ...costume.similarity.archetypeTags,
  ].join(" ").toLowerCase();
  
  // Age indicators in costume
  const ageHints: Record<string, string[]> = {
    teen: ["teen", "young", "youth", "kid", "student"],
    "20s": ["young", "20s", "twenties"],
    "30s": ["30s", "thirties", "adult"],
    "40s": ["40s", "forties", "mature"],
    "50s": ["50s", "fifties", "older"],
    "60plus": ["elderly", "senior", "old", "60s", "70s"],
  };
  
  const userAgeHints = ageHints[photoCues.ageRange] || [];
  
  for (const hint of userAgeHints) {
    if (costumeMetadata.includes(hint)) {
      return 1.0;
    }
  }
  
  // No specific age requirement in costume = works for anyone
  return 0.6;
}

/**
 * Calculate vibe/aesthetic keyword match
 */
function scoreVibeKeywords(
  costume: Costume,
  photoCues?: QuizResponse["photoCues"]
): number {
  if (!photoCues?.vibeKeywords || photoCues.vibeKeywords.length === 0) {
    return 0;
  }
  
  const costumeVibes = [
    ...costume.similarity.vibeTags,
    ...costume.similarity.archetypeTags,
  ].map(v => v.toLowerCase());
  
  let matches = 0;
  for (const keyword of photoCues.vibeKeywords) {
    if (costumeVibes.some(v => v.includes(keyword.toLowerCase()) || 
                               keyword.toLowerCase().includes(v))) {
      matches++;
    }
  }
  
  return matches / photoCues.vibeKeywords.length;
}

/**
 * Calculate total weighted score for a costume
 */
export function scoreCostume(costume: Costume, quiz: QuizResponse): number {
  const scores = {
    vibe: scoreVibes(costume, quiz.goals) * WEIGHTS.vibeMatch,
    niche: scoreNiche(costume, quiz.nicheTarget) * WEIGHTS.nicheMatch,
    effort: scoreEffort(costume, quiz.effort) * WEIGHTS.effortMatch,
    budget: scoreBudget(costume, quiz.budget) * WEIGHTS.budgetMatch,
    gender: scoreGenderPresentation(costume, quiz.genderPref) * WEIGHTS.genderMatch,
    practical: scorePractical(costume, quiz) * WEIGHTS.practicalBonus,
    resemblance: scoreResemblance(costume, quiz.resemblanceTarget, quiz.photoCues) * WEIGHTS.resemblanceMatch,
    closet: scoreClosetBoosters(costume, quiz.closetBoosters) * WEIGHTS.closetBooster,
    photoCues: scorePhotoCues(costume, quiz.photoCues) * WEIGHTS.photoCues,
    era: scoreEra(costume, quiz.era) * WEIGHTS.eraMatch,
    // New photo-based scores
    celebrityMatch: scoreCelebrityMatch(costume, quiz.photoCues) * WEIGHTS.celebrityMatch,
    skinTone: scoreSkinTone(costume, quiz.photoCues) * WEIGHTS.skinToneMatch,
    ageRange: scoreAgeRange(costume, quiz.photoCues) * WEIGHTS.ageRangeMatch,
    vibeKeywords: scoreVibeKeywords(costume, quiz.photoCues) * WEIGHTS.vibeKeywordMatch,
  };

  return Object.values(scores).reduce((sum, s) => sum + s, 0);
}

/**
 * Score and sort all costumes, return top N
 */
export function scoreAndRank(
  costumes: Costume[],
  quiz: QuizResponse,
  topN: number = 20
): ScoredCostume[] {
  const scored = costumes.map((costume) => ({
    ...costume,
    score: scoreCostume(costume, quiz),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}

