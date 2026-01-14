/**
 * Library Index
 *
 * Barrel file for clean imports.
 * Usage: import { Costume, filterByConstraints, scoreCostume } from "@/lib";
 */

// Schemas and Types
export {
  // Image sources
  ImageSourceSchema,
  TmdbImageSourceSchema,
  WikimediaImageSourceSchema,
  ManualImageSourceSchema,
  type ImageSource,

  // Costume
  CostumeSchema,
  type Costume,

  // Quiz
  QuizResponseSchema,
  PhotoCuesSchema,
  type QuizResponse,
  type PhotoCues,

  // Recommendations
  RecommendationSchema,
  RecommendResponseSchema,
  type Recommendation,
  type RecommendResponse,

  // More Like This
  MoreLikeThisRequestSchema,
  MoreLikeThisResponseSchema,
  RefinementDirectionSchema,
  type MoreLikeThisRequest,
  type MoreLikeThisResponse,
  type RefinementDirection,

  // Derived state
  type DerivedQuizState,
} from "./schema";

// Filtering
export {
  filterByConstraints,
  filterByPractical,
  applyHardFilters,
} from "./filter";

// Scoring
export {
  scoreCostume,
  scoreAndRank,
  type ScoredCostume,
} from "./score";

// Diversity
export {
  ensureDiversity,
  ensureUniverseDiversity,
} from "./diversify";

// Relaxation
export {
  applyRelaxationLadder,
  formatRelaxationMessage,
  type RelaxationResult,
} from "./relax";

// Images
export {
  resolveImage,
  resolveImageWithFallback,
  type ResolvedImage,
} from "./images";

// LLM
export {
  generateRecommendations,
  enrichRecommendations,
} from "./llm";

// Fallback
export {
  generateFallbackRecommendation,
  generateFallbackRecommendations,
} from "./fallback";

// Dataset
export {
  loadDataset,
  clearDatasetCache,
} from "./dataset";

// Rate Limiting
export {
  checkRateLimit,
  type RateLimitResult,
} from "./rate-limit";

// Config
export {
  getConfig,
  isFeatureAvailable,
  type Config,
} from "./config";

