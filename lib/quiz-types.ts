/**
 * Quiz Types and Constants
 * 
 * Reference: README.md §6 Content: Final Quiz Questions
 */

import type { QuizResponse, PhotoCues } from "./schema";

// =============================================================================
// Quiz Step Types
// =============================================================================

export type QuizStep =
  | "hero"
  | "q1_goals"
  | "q2_niche"
  | "q3_effort"
  | "q4_gender"
  | "q4b_yourgender"
  | "q5_resemblance"
  | "q6_universe"
  | "q7_era"
  | "q8_skincolor"
  | "q9_practical"
  | "q10_closet"
  | "q11_photo"
  | "loading"
  | "results";

export const QUIZ_STEPS: QuizStep[] = [
  "hero",
  "q1_goals",
  "q2_niche",
  "q3_effort",
  "q4_gender",
  "q4b_yourgender", // Conditional - only shows if q4 = "match"
  "q5_resemblance",
  "q6_universe",
  "q7_era",
  "q8_skincolor",
  "q9_practical",
  "q10_closet",
  "q11_photo",
  "loading",
  "results",
];

// Question steps only (excludes hero, loading, results)
export const QUESTION_STEPS: QuizStep[] = QUIZ_STEPS.filter(
  (s) => s.startsWith("q")
);

export const TOTAL_QUESTIONS = QUESTION_STEPS.length;

// =============================================================================
// Default Quiz Values
// =============================================================================

export const DEFAULT_QUIZ_ANSWERS: Partial<QuizResponse> = {
  goals: [],
  nicheTarget: 5, // Middle of 1-10
  effort: undefined,
  budget: "dont_care", // Default budget since question is removed
  genderPref: "dont_care",
  resemblanceTarget: 5, // Middle of 1-10
  universes: [],
  era: "any",
  boundaries: {
    noSkinToneChange: true, // Default ON per README
    avoidCultureSpecific: false,
    avoidReligious: false,
    avoidPolitical: false,
    avoidFacePaint: false,
    avoidWigs: false,
    avoidControversial: false,
  },
  practical: {
    mustBeComfortable: false,
    mustSurviveCrowdedBar: false,
    needsPockets: false,
    indoorOnly: false,
  },
  closetBoosters: {
    hasLeatherJacket: false,
    hasSunglasses: false,
    hasSuit: false,
    hasBoots: false,
    hasDress: false,
    hasBlazer: false,
  },
};

// =============================================================================
// Quiz State
// =============================================================================

export interface QuizState {
  currentStep: QuizStep;
  answers: Partial<QuizResponse>;
  photoCues?: PhotoCues;
  shownCostumeIds: string[];
  isSubmitting: boolean;
  error: string | null;
}

// =============================================================================
// Quiz Actions
// =============================================================================

export type QuizAction =
  | { type: "SET_STEP"; step: QuizStep }
  | { type: "SET_ANSWER"; field: keyof QuizResponse; value: unknown }
  | { type: "SET_NESTED_ANSWER"; parent: "boundaries" | "practical" | "closetBoosters"; field: string; value: boolean }
  | { type: "SET_PHOTO_CUES"; cues: PhotoCues }
  | { type: "GO_BACK" }
  | { type: "GO_NEXT" }
  | { type: "RESET" }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "ADD_SHOWN_COSTUME"; id: string }
  | { type: "HYDRATE"; state: QuizState };

// =============================================================================
// Question Content
// =============================================================================

export interface QuestionConfig {
  step: QuizStep;
  headline: string;
  subline: string;
  optional?: boolean;
}

export const QUESTION_CONFIG: QuestionConfig[] = [
  {
    step: "q1_goals",
    headline: "What's the vibe?",
    subline: "Pick up to 2. No judgment. Okay, a little judgment.",
  },
  {
    step: "q2_niche",
    headline: "Obscurity level?",
    subline: "1 = everyone gets it. 10 = 3 people at the party will bow.",
  },
  {
    step: "q3_effort",
    headline: "How lazy are we being?",
    subline: "Be honest. It's just us here.",
  },
  {
    step: "q4_gender",
    headline: "Match your gender vibe?",
    subline: "Should the character's gender match yours?",
  },
  {
    step: "q4b_yourgender",
    headline: "What's your gender?",
    subline: "So we can match you properly.",
  },
  {
    step: "q5_resemblance",
    headline: "Accuracy or vibe?",
    subline: "1 = just the energy. 10 = people will do a double-take.",
  },
  {
    step: "q6_universe",
    headline: "Where are we pulling from?",
    subline: "Pick as many as you want. We're not limiting your range.",
  },
  {
    step: "q7_era",
    headline: "Any era preference?",
    subline: "The 90s are always a safe bet tbh.",
  },
  {
    step: "q8_skincolor",
    headline: "Are you Black?",
    subline: "We don't want you to do blackface.",
  },
  {
    step: "q9_practical",
    headline: "Survival mode:",
    subline: "What needs to happen for you to not hate your costume by midnight?",
  },
  {
    step: "q10_closet",
    headline: "Got anything good already?",
    subline: "We'll work around your existing drip.",
    optional: true,
  },
  {
    step: "q11_photo",
    headline: "Drop a selfie?",
    subline: "Helps us match hair/glasses/beard. Deleted instantly. Pinky promise.",
    optional: true,
  },
];

// =============================================================================
// Option Types
// =============================================================================

export interface GoalOption {
  value: QuizResponse["goals"][number];
  label: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  { value: "funny", label: "Funny" },
  { value: "sexy", label: "Sexy" },
  { value: "stylish", label: "Stylish" },
  { value: "clever", label: "Clever" },
  { value: "lowEffortHighPayoff", label: "Low effort, high payoff" },
];

export interface EffortOption {
  value: QuizResponse["effort"];
  label: string;
  description: string;
}

export const EFFORT_OPTIONS: EffortOption[] = [
  { value: "one_item", label: "Absolute minimum", description: "One item. Done. Moving on." },
  { value: "few_fast", label: "Low effort, high impact", description: "Amazon Prime is my best friend" },
  { value: "some_work", label: "I'll commit", description: "Make it worth my time" },
  { value: "suffer_for_bit", label: "I'll suffer for the art", description: "Pain is temporary. Glory is forever." },
];

export interface BudgetOption {
  value: QuizResponse["budget"];
  label: string;
}

export const BUDGET_OPTIONS: BudgetOption[] = [
  { value: "lt_30", label: "Broke but creative (<$30)" },
  { value: "30_75", label: "Reasonable ($30–$75)" },
  { value: "75_150", label: "Actually invested ($75–$150)" },
  { value: "dont_care", label: "Money is fake anyway" },
];

export interface GenderOption {
  value: QuizResponse["genderPref"];
  label: string;
}

export const GENDER_OPTIONS: GenderOption[] = [
  { value: "match", label: "Yeah, match me" },
  { value: "dont_match", label: "Nah, flip it" },
  { value: "dont_care", label: "I contain multitudes" },
];

export interface UserGenderOption {
  value: "male" | "female" | "other";
  label: string;
}

export const USER_GENDER_OPTIONS: UserGenderOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other / Non-binary" },
];

export interface SkinColorOption {
  value: boolean;
  label: string;
}

export const SKIN_COLOR_OPTIONS: SkinColorOption[] = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

export interface UniverseOption {
  value: QuizResponse["universes"][number];
  label: string;
}

export const UNIVERSE_OPTIONS: UniverseOption[] = [
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "internet", label: "Internet / Memes" },
];

// Special option for "Surprise me" - handled separately in UI
export const SURPRISE_ME_ENABLED = true;

export interface EraOption {
  value: QuizResponse["era"];
  label: string;
}

export const ERA_OPTIONS: EraOption[] = [
  { value: "70s_80s", label: "70s / 80s (big energy)" },
  { value: "90s", label: "90s (nostalgia bait)" },
  { value: "2000s", label: "2000s (underrated tbh)" },
  { value: "current", label: "Recent (they'll actually get it)" },
  { value: "any", label: "Surprise me" },
];

export interface BoundaryOption {
  field: keyof QuizResponse["boundaries"];
  label: string;
  defaultOn?: boolean;
}

export const BOUNDARY_OPTIONS: BoundaryOption[] = [
  { field: "noSkinToneChange", label: "I won't change my skin tone", defaultOn: true },
  { field: "avoidCultureSpecific", label: "Avoid race/culture-specific costumes" },
  { field: "avoidReligious", label: "Avoid religious outfits/symbols" },
  { field: "avoidPolitical", label: "Avoid political figures" },
  { field: "avoidFacePaint", label: "Avoid heavy makeup/face paint" },
  { field: "avoidWigs", label: "Avoid wigs" },
  { field: "avoidControversial", label: "Avoid anything controversial" },
];

export interface PracticalOption {
  field: keyof QuizResponse["practical"];
  label: string;
}

export const PRACTICAL_OPTIONS: PracticalOption[] = [
  { field: "mustBeComfortable", label: "Comfort is non-negotiable" },
  { field: "mustSurviveCrowdedBar", label: "Will survive drunk people bumping into me" },
  { field: "needsPockets", label: "Must have pockets (where else does my phone go)" },
  { field: "indoorOnly", label: "Staying inside like a civilized person" },
];

export interface ClosetOption {
  field: keyof NonNullable<QuizResponse["closetBoosters"]>;
  label: string;
}

export const CLOSET_OPTIONS: ClosetOption[] = [
  { field: "hasLeatherJacket", label: "Leather jacket" },
  { field: "hasSunglasses", label: "Sunglasses" },
  { field: "hasSuit", label: "Suit" },
  { field: "hasBoots", label: "Boots" },
  { field: "hasDress", label: "Dress" },
  { field: "hasBlazer", label: "Blazer" },
];

