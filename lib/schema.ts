/**
 * Core Schemas and Types
 *
 * Reference: README.md §4 Schemas (Canonical)
 * https://github.com/.../celeb/blob/main/README.md#4-schemas-canonical
 */

import { z } from "zod";

// =============================================================================
// Image Source Schema
// Reference: README.md §4.1 - ImageSource type
// =============================================================================

export const TmdbImageSourceSchema = z.object({
  kind: z.literal("tmdb"),
  tmdbId: z.number(),
  imagePath: z.string(),
  imageType: z.enum(["poster", "backdrop"]),
  mediaType: z.enum(["movie", "tv"]).optional().default("movie"),
});

export const WikimediaImageSourceSchema = z.object({
  kind: z.literal("wikimedia"),
  fileTitle: z.string(),
  pageUrl: z.string().optional(),
});

export const ManualImageSourceSchema = z.object({
  kind: z.literal("manual"),
  // Allow both full URLs and relative paths (for internal placeholders)
  url: z.string().refine(
    (val) => val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://"),
    { message: "Must be a valid URL or relative path starting with /" }
  ),
  attribution: z.string().optional(),
});

export const ImageSourceSchema = z.discriminatedUnion("kind", [
  TmdbImageSourceSchema,
  WikimediaImageSourceSchema,
  ManualImageSourceSchema,
]);

export type ImageSource = z.infer<typeof ImageSourceSchema>;

// =============================================================================
// Costume Schema
// Reference: README.md §4.1 - Costume type
// =============================================================================

const VibeScoreSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

// Scale 1-10 for user-facing sliders
const NicheScoreSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
]);

export const CostumeSchema = z.object({
  id: z.string(), // e.g., "cos_morpheus_matrix"
  name: z.string(), // e.g., "Morpheus"
  displayTitle: z.string(), // e.g., "Morpheus (The Matrix)"
  universe: z.enum(["movie", "tv", "music", "sports", "internet"]),
  sourceTitle: z.string().optional(),
  era: z.enum(["70s_80s", "90s", "2000s", "current", "any"]),

  vibes: z.object({
    funny: VibeScoreSchema,
    sexy: VibeScoreSchema,
    stylish: VibeScoreSchema,
    clever: VibeScoreSchema,
    lowEffortHighPayoff: VibeScoreSchema,
  }),

  nicheScore: NicheScoreSchema, // 1 = everyone gets it, 7 = deep cut

  genderPresentation: z.enum(["masc", "femme", "androgynous", "flexible"]),

  constraints: z.object({
    effort: z.enum(["one_item", "few_fast", "some_work", "suffer_for_bit"]),
    budget: z.enum(["lt_30", "30_75", "75_150", "dont_care"]),
    comfort: z.enum(["high", "medium", "low"]),
    barFriendly: z.boolean(),
    pocketsLikely: z.boolean(),
  }),

  requirements: z.object({
    anchorItem: z.string(),
    items: z.array(z.string()).min(3).max(10),
    makeupLevel: z.enum(["none", "light", "heavy"]),
    wigRequired: z.boolean(),
    facePaintRequired: z.boolean(),
    propsLevel: z.enum(["none", "optional", "required"]),
  }),

  safety: z.object({
    cultureSpecific: z.boolean(),
    religiousAttire: z.boolean(),
    politicalFigure: z.boolean(),
    controversial: z.boolean(),
    skinToneChangeImplied: z.boolean(), // Should basically never be true
  }),

  // Added per README.md §18 - Characters with non-human skin
  requiresBodyPaintOrFullFacePaint: z.boolean().optional().default(false),

  similarity: z.object({
    archetypeTags: z.array(z.string()), // e.g., ["suit", "sunglasses", "cool"]
    vibeTags: z.array(z.string()), // e.g., ["stylish", "recognizable"]
  }),

  images: z.object({
    primary: ImageSourceSchema,
    alternatives: z.array(ImageSourceSchema).optional(),
  }),

  notes: z.string().optional(), // Editorial hint for LLM
});

export type Costume = z.infer<typeof CostumeSchema>;

// =============================================================================
// Photo Cues Schema
// Comprehensive facial analysis for celebrity matching
// =============================================================================

export const PhotoCuesSchema = z.object({
  // Basic features (original)
  glassesLikely: z.boolean(),
  facialHairLikely: z.boolean(),
  hairLength: z.enum(["short", "medium", "long", "unknown"]),
  hairColor: z.enum(["black", "brown", "blonde", "red", "gray", "white", "other", "unknown"]),
  hairStyle: z.string().optional(), // e.g., "curly", "straight", "wavy", "bald"
  
  // Face shape analysis
  faceShape: z.enum([
    "oval", 
    "round", 
    "square", 
    "heart", 
    "oblong", 
    "diamond", 
    "rectangle",
    "unknown"
  ]),
  
  // Skin tone (for matching, not filtering)
  skinTone: z.enum([
    "very_light",
    "light", 
    "medium", 
    "olive",
    "tan", 
    "brown", 
    "dark",
    "unknown"
  ]),
  
  // Notable facial features
  features: z.array(z.string()).optional(), // e.g., ["strong jawline", "high cheekbones", "full lips"]
  
  // Estimated age range (for character matching)
  ageRange: z.enum(["teen", "20s", "30s", "40s", "50s", "60plus", "unknown"]),
  
  // Build/body type if visible
  build: z.enum(["slim", "athletic", "average", "muscular", "large", "unknown"]).optional(),
  
  // Celebrity lookalikes - the key feature!
  celebrityMatches: z.array(z.object({
    name: z.string(),           // Celebrity name
    confidence: z.enum(["high", "medium", "low"]),
    notes: z.string().optional(), // e.g., "similar bone structure", "same vibe"
  })).optional(),
  
  // Overall vibe/aesthetic
  vibeKeywords: z.array(z.string()).optional(), // e.g., ["classic", "edgy", "approachable", "intense"]
});

export type PhotoCues = z.infer<typeof PhotoCuesSchema>;

// =============================================================================
// Quiz Response Schema
// Reference: README.md §4.2 - QuizResponse type
// Updated with 1-7 sliders per §3 decision
// =============================================================================

export const QuizResponseSchema = z.object({
  goals: z
    .array(z.enum(["funny", "sexy", "stylish", "clever", "lowEffortHighPayoff"]))
    .min(1)
    .max(2),
  nicheTarget: NicheScoreSchema, // 1-10 scale
  effort: z.enum(["one_item", "few_fast", "some_work", "suffer_for_bit"]),
  budget: z.enum(["lt_30", "30_75", "75_150", "dont_care"]),

  genderPref: z.enum(["match", "dont_match", "dont_care"]),
  userGender: z.enum(["male", "female", "other"]).optional(), // Only if genderPref = "match"
  isBlack: z.boolean().optional(), // For avoiding blackface
  resemblanceTarget: NicheScoreSchema, // 1-10 scale

  universes: z.array(z.enum(["movie", "tv", "music", "sports", "internet"])),
  era: z.enum(["70s_80s", "90s", "2000s", "current", "any"]),

  boundaries: z.object({
    noSkinToneChange: z.boolean().default(true), // Default ON
    avoidCultureSpecific: z.boolean(),
    avoidReligious: z.boolean(),
    avoidPolitical: z.boolean(),
    avoidFacePaint: z.boolean(),
    avoidWigs: z.boolean(),
    avoidControversial: z.boolean(),
  }),

  practical: z.object({
    mustBeComfortable: z.boolean(),
    mustSurviveCrowdedBar: z.boolean(),
    needsPockets: z.boolean(),
    indoorOnly: z.boolean(),
  }),

  closetBoosters: z
    .object({
      hasLeatherJacket: z.boolean().optional(),
      hasSunglasses: z.boolean().optional(),
      hasSuit: z.boolean().optional(),
      hasBoots: z.boolean().optional(),
      hasDress: z.boolean().optional(),
      hasBlazer: z.boolean().optional(),
    })
    .optional(),

  photoCues: PhotoCuesSchema.optional(),

  notes: z.string().optional(),
});

export type QuizResponse = z.infer<typeof QuizResponseSchema>;

// =============================================================================
// Recommendation Output Schema
// Reference: README.md §4.3 - Recommendation API Output
// =============================================================================

export const RecommendationSchema = z.object({
  costumeId: z.string(),
  title: z.string(), // Display title from dataset
  image: z.object({
    url: z.string(),
    attributionText: z.string().optional(),
    attributionLink: z.string().optional(),
  }),
  whyItMatches: z.array(z.string()).min(2).max(3),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  anchorItem: z.string(),
  shoppingList: z.array(z.string()).min(3).max(7),
  substitutions: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  similarityTags: z.array(z.string()), // For more-like-this
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export const RecommendResponseSchema = z.object({
  recommendations: z.tuple([
    RecommendationSchema,
    RecommendationSchema,
    RecommendationSchema,
  ]),
  meta: z.object({
    datasetVersion: z.string(),
    mode: z.enum(["llm", "fallback"]),
    relaxationsApplied: z.array(z.string()).optional(),
  }),
});

export type RecommendResponse = z.infer<typeof RecommendResponseSchema>;

// =============================================================================
// More Like This Request/Response
// Reference: README.md §8.2
// =============================================================================

export const RefinementDirectionSchema = z.enum([
  "more_recognizable",
  "weirder",
  "easier",
  "hotter",
  "stylisher",
]);

export type RefinementDirection = z.infer<typeof RefinementDirectionSchema>;

export const MoreLikeThisRequestSchema = z.object({
  selectedCostumeId: z.string(),
  quiz: QuizResponseSchema,
  direction: RefinementDirectionSchema.optional(),
  excludeIds: z.array(z.string()).optional(),
});

export type MoreLikeThisRequest = z.infer<typeof MoreLikeThisRequestSchema>;

export const MoreLikeThisResponseSchema = z.object({
  recommendations: z.array(RecommendationSchema).min(5).max(5),
});

export type MoreLikeThisResponse = z.infer<typeof MoreLikeThisResponseSchema>;

// =============================================================================
// Derived Quiz State (for refinement stacking)
// Reference: README.md §5 - Refinements stack decision
// =============================================================================

export type DerivedQuizState = QuizResponse & {
  nicheAdjustment: number; // +/- from original
  effortAdjustment: number; // steps down from original
  vibeBoosts: Partial<Record<"sexy" | "stylish", number>>;
};

