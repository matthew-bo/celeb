# Implementation Plan — Costume Recommender

This document outlines the phased implementation plan for the Costume Recommender website. All specifications reference [`README.md`](../README.md).

---

## Overview

**Target:** Single-page editorial quiz → 3 costume recommendations with images + shopping lists  
**Stack:** Next.js (App Router), TypeScript, Tailwind, OpenAI, TMDB, Upstash Redis  
**Primary Platform:** Mobile web  

---

## Phase 0: Project Setup ✅
**Duration:** ~2 hours | **Status:** Complete

### 0.1 Initialize Next.js Project
- [x] Create Next.js app with App Router, TypeScript, Tailwind
- [x] Configure ESLint + Prettier
- [x] Set up directory structure per [README.md §13](../README.md#13-directory-structure-final)

```
/app
  page.tsx
  /api
    /recommend/route.ts
    /more-like-this/route.ts
/components
/data
/lib
/styles
```

### 0.2 Environment & Dependencies
- [x] Create `.env.example` with required keys:
  ```
  OPENAI_API_KEY=
  TMDB_API_KEY=
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  ```
- [x] Install core dependencies:
  - `zod` (schema validation)
  - `openai` (LLM client)
  - `@upstash/ratelimit` + `@upstash/redis` (rate limiting)
- [ ] Optional: `framer-motion` (subtle transitions only)

### 0.3 Validation Script Scaffold
- [x] Create `scripts/validate-dataset.ts`
- [x] Add npm script: `"validate-dataset": "tsx scripts/validate-dataset.ts"`

---

## Phase 1: Core Schemas & Types ✅
**Duration:** ~3 hours | **Status:** Complete

Reference: [README.md §4 Schemas](../README.md#4-schemas-canonical)

### 1.1 Zod Schemas (`/lib/schema.ts`)
- [x] `ImageSourceSchema` — three variants: tmdb, wikimedia, manual
- [x] `CostumeSchema` — full costume type with all fields
  - Include new field: `requiresBodyPaintOrFullFacePaint: boolean` per [§18](../README.md#18-characters-with-non-human-skin-gamora-avatar-etc)
- [x] `QuizResponseSchema` — user quiz answers
  - Update sliders to 1-7 range per [§3](../README.md#3-slider-granularity-110-vs-simpler)
- [x] `RecommendationSchema` — API output per costume
- [x] `RecommendResponseSchema` — full API response wrapper
- [x] Export inferred TypeScript types

### 1.2 Additional Types
- [x] `PhotoCues` type for extracted features:
  ```ts
  type PhotoCues = {
    glassesLikely: boolean;
    facialHairLikely: boolean;
    hairLength: "short" | "medium" | "long" | "unknown";
  };
  ```
- [x] `DerivedQuizState` for refinement stacking per [§5](../README.md#5-can-refinements-stack)
- [x] `RefinementDirection` enum: `more_recognizable | weirder | easier | hotter | stylisher`

### 1.3 Validation Script Implementation
- [x] Load `data/costumes.v1.json`
- [x] Validate each entry against `CostumeSchema`
- [x] Check for duplicate IDs
- [x] Check all image pointers have required fields
- [x] Exit with error code if validation fails

---

## Phase 2: Dataset Creation 🔄
**Duration:** ~8-12 hours (content work) | **Status:** In Progress

Reference: [README.md §4.1 Costume Schema](../README.md#41-costume-schema-final)

See also: [`docs/status.md`](./status.md) for detailed coverage analysis

### 2.1 Starter Dataset Structure
- [ ] Expand `data/costumes.v1.json` to 50 costumes (currently: 5)
- [ ] Ensure coverage across:
  - All 5 universes (movie, tv, music, sports, internet)
  - All 4 eras
  - All effort levels
  - All budget tiers
  - Mix of gender presentations

### 2.2 Dataset Expansion
- [ ] Expand to 250-400 entries per [§6](../README.md#6-100200-costumes-vs-filter-explosion)
- [ ] Run coverage test script:
  ```
  npm run test-coverage -- --universe=sports --effort=one_item --budget=lt_30
  ```
- [ ] Identify and fill gaps

### 2.3 Image Pointers
- [ ] Add TMDB pointers for movie/TV characters
- [ ] Add Wikimedia pointers for public figures
- [ ] Document manual URL sources with attribution
- [ ] Ensure every costume has at least `images.primary`

---

## Phase 3: Backend Engine
**Duration:** ~6-8 hours

### 3.1 Filter Engine (`/lib/filter.ts`)
Reference: [README.md §6.1 Deterministic filter](../README.md#61-deterministic-filter-hard-constraints)

- [ ] Implement hard constraint filtering:
  - Boundary filters (culture, religious, political, controversial, skin tone)
  - `avoidWigs && wigRequired` → exclude
  - `avoidFacePaint && (facePaintRequired || requiresBodyPaintOrFullFacePaint)` → exclude
  - Universe filter (unless "Surprise me")
- [ ] Return filtered costume array

### 3.2 Scoring Engine (`/lib/score.ts`)
Reference: [README.md §6.2 Scoring](../README.md#62-scoring-soft-constraints)

- [ ] Implement weighted scoring:
  - Vibe match (goals → vibes)
  - Niche match: `1 - abs(nicheScore - nicheTarget) / 6` (adjusted for 1-7 scale)
  - Effort/budget fit (exact match bonus, within-one penalty)
  - Practical constraints (comfort, barFriendly, pockets)
  - Closet boosters (owned items matching)
- [ ] Return sorted array with scores

### 3.3 Relaxation Ladder (`/lib/relax.ts`)
Reference: [README.md §2](../README.md#2-what-happens-when-filters-are-too-restrictive)

- [ ] Implement relaxation steps:
  1. Keep boundaries strict (never relax)
  2. Relax era → soft preference
  3. Expand universe (with "Expanded" flag)
  4. Relax budget up one tier
  5. Relax effort up one tier
- [ ] Return: `{ costumes, relaxationsApplied: string[] }`

### 3.4 Diversity Rules (`/lib/diversify.ts`)
Reference: [README.md §6.3](../README.md#63-candidate-shortlist)

- [ ] Ensure top 10 candidates have at least 2 different archetypeTags
- [ ] Prevent all-same-universe results when user selected "Surprise me"

### 3.5 Image Resolver (`/lib/images.ts`)
Reference: [README.md §5 Image Strategy](../README.md#5-image-strategy-answers-your-web-search-or-stored-question)

- [ ] `resolveImage(source: ImageSource)` → `{ url, attributionText?, attributionLink? }`
- [ ] TMDB: fetch config once, cache 24h, build full URL
- [ ] Wikimedia: construct URL from file title
- [ ] Manual: pass through with attribution
- [ ] Fallback cascade: primary → alternatives → placeholder

---

## Phase 4: LLM Integration
**Duration:** ~5-6 hours

Reference: [README.md §7 AI Integration](../README.md#7-ai-integration-detailed)

### 4.1 LLM Wrapper (`/lib/llm.ts`)
- [ ] Create OpenAI client wrapper
- [ ] Implement `generateRecommendations(quiz, candidates)`:
  - System message with editorial tone rules
  - User payload with quiz + candidates + styleGuide
  - Request JSON mode / structured output
  - Hard timeout: 6-8s per [§10](../README.md#10-latency-budget)
- [ ] Return parsed recommendations or throw

### 4.2 Prompt Templates (`/lib/prompts.ts`)
Reference: [README.md §7.1-7.2](../README.md#71-llm-prompt-contract-implementation-requirements)

- [ ] System prompt enforcing:
  - Editorial stylist persona
  - No AI language, no hedging
  - Select only from candidate IDs
  - Output strict JSON
- [ ] Forbidden phrases list + detection function:
  - "Based on your preferences"
  - "As an AI"
  - "I think" / "I recommend" / "You might like"
- [ ] Style guide bullet points for assertive tone

### 4.3 Output Validation
Reference: [README.md §7.3](../README.md#73-structured-output-validation)

- [ ] Parse JSON response
- [ ] Validate via Zod
- [ ] Verify all `costumeId` values exist in candidates
- [ ] Re-verify boundaries post-generation (belt + suspenders)
- [ ] If validation fails → trigger fallback per [§16](../README.md#16-llm-returns-invalid-costume-ids)

### 4.4 Fallback Generator (`/lib/fallback.ts`)
Reference: [README.md §7.4](../README.md#74-fallback-generation-no-llm), [§11](../README.md#11-fallback-copy-quality)

- [ ] Pick deterministic top 3 from scored candidates
- [ ] Template-based `whyItMatches` generation (10-15 variants)
- [ ] Pull `shoppingList` from `costume.requirements.items`
- [ ] Return with `meta.mode = "fallback"`

---

## Phase 5: API Routes
**Duration:** ~4-5 hours

### 5.1 Rate Limiting Setup
Reference: [README.md §12](../README.md#12-rate-limiting-storage-vercel-instances)

- [ ] Configure Upstash Redis client
- [ ] Implement rate limiter:
  - `/api/recommend`: 30 req / 10 min / IP
  - `/api/more-like-this`: 60 req / 10 min / IP
  - Burst: 5 req / 10 sec

### 5.2 `POST /api/recommend`
Reference: [README.md §8.1](../README.md#81-post-apirecommend)

- [ ] Parse + validate `QuizResponse` body
- [ ] Rate limit check
- [ ] Load dataset (cached in module scope per [§13](../README.md#13-dataset-loading))
- [ ] Filter → Score → Shortlist top 20
- [ ] Apply relaxation if needed
- [ ] Call LLM (or fallback on timeout/error)
- [ ] Resolve image URLs
- [ ] Return `RecommendResponse`

### 5.3 `POST /api/more-like-this`
Reference: [README.md §8.2](../README.md#82-post-apimore-like-this)

- [ ] Parse body: `{ selectedCostumeId, quiz, direction?, excludeIds? }`
- [ ] Rate limit check
- [ ] Apply direction adjustment:
  - `more_recognizable` → nicheTarget -= 2
  - `weirder` → nicheTarget += 2
  - `easier` → effort down one notch
  - `hotter` → boost sexy weight
  - `stylisher` → boost stylish weight
- [ ] Filter by similarity tags of selected costume
- [ ] Exclude previously shown IDs
- [ ] Return top 5

### 5.4 `POST /api/photo-features` (Optional v1)
Reference: [README.md §1](../README.md#1-q12-photo-upload--show-it-in-v1)

- [ ] Accept image upload (base64 or multipart)
- [ ] Extract cues via vision model or simple heuristics:
  - `glassesLikely`
  - `facialHairLikely`
  - `hairLength`
- [ ] Return `PhotoCues`
- [ ] Do NOT store image bytes

---

## Phase 6: Frontend — Quiz Flow
**Duration:** ~8-10 hours

Reference: [README.md §6 Content: Final Quiz Questions](../README.md#6-content-final-quiz-questions-funny--informative)

### 6.1 State Management
Reference: [README.md §14](../README.md#14-client-state-management), [§15](../README.md#15-no-localstorage-vs-refresh-loses-everything)

- [ ] Create `useQuiz` hook with `useReducer`
- [ ] Actions: `SET_ANSWER`, `GO_BACK`, `RESET`, `APPLY_REFINEMENT`, `RESET_TWEAKS`
- [ ] Persist to `sessionStorage`:
  - Quiz answers
  - Derived tweaks
  - Shown costume IDs
- [ ] Integrate with History API for back button support

### 6.2 Core Components
- [ ] `Hero.tsx` — intro section with CTA
- [ ] `QuizStepper.tsx` — progress indicator "5/12", back button
- [ ] `QuestionCard.tsx` — container with headline + subline
- [ ] `ChoiceChips.tsx` — multi-select chips (max 2 for Q1)
- [ ] `Slider.tsx` — 1-7 range with labels per [§3](../README.md#3-slider-granularity-110-vs-simpler)
- [ ] `ToggleList.tsx` — multi-select toggles for boundaries/practical
- [ ] `PhotoUpload.tsx` — camera/gallery picker, "We don't store your photo"

### 6.3 Quiz Questions Implementation
Implement all 12 questions per [README.md §6](../README.md#6-content-final-quiz-questions-funny--informative):

| # | Question | Component |
|---|----------|-----------|
| 1 | Costume Objective | `ChoiceChips` (max 2) |
| 2 | Niche slider | `Slider` 1-7 |
| 3 | Effort truth serum | Single select |
| 4 | Budget | Single select |
| 5 | Gender presentation | Single select |
| 6 | Look-alike vs vibe | `Slider` 1-7 |
| 7 | Universe | `ChoiceChips` (multi) |
| 8 | Era | Single select |
| 9 | Boundaries | `ToggleList` (skin tone ON by default) |
| 10 | Practical constraints | `ToggleList` |
| 11 | Closet boosters | `ToggleList` + optional text |
| 12 | Optional photo | `PhotoUpload` |

### 6.4 Transitions
- [ ] Simple fade/slide between questions (150-250ms)
- [ ] No "AI-like" animations per [README.md §9.2](../README.md#92-interaction-rules)

---

## Phase 7: Frontend — Results
**Duration:** ~6-8 hours

Reference: [README.md §7 Results Requirements](../README.md#7-results-requirements)

### 7.1 Results Components
- [ ] `ResultsGrid.tsx` — displays 3 recommendation cards
- [ ] `RecommendationCard.tsx`:
  - Reference image (2:3 aspect ratio)
  - Title: "Morpheus (The Matrix)"
  - Difficulty badge: Easy/Medium/Hard
  - "Why it matches" bullets (2-3)
  - Anchor item
  - Shopping list (3-7 items)
  - Substitutions (optional)
  - Warnings (optional)
- [ ] `RefineBar.tsx` — refinement buttons always visible

### 7.2 Loading & Error States
Reference: [README.md §19](../README.md#19-error-ux-api-failure)

- [ ] Skeleton cards while loading (editorial gray, not spinners)
- [ ] Error state with:
  - Message: "We couldn't load your picks..."
  - Buttons: Retry, Make it easier, Restart
- [ ] Fallback "Manual mode": top 12 starter costumes

### 7.3 Image Handling
Reference: [README.md §17](../README.md#17-image-fallback-cascade--placeholder)

- [ ] Blurred placeholder while loading
- [ ] Fallback placeholder: editorial gray block with icon
- [ ] Use `next/image` with proper sizing

### 7.4 Refinement Flow
Reference: [README.md §4](../README.md#4-refinement-asymmetry-3-cards-vs-5), [§5](../README.md#5-can-refinements-stack)

- [ ] "More like this" on card → 5 results below (not replacing)
- [ ] Direction buttons update `derivedQuizState`
- [ ] "Reset tweaks" link returns to baseline
- [ ] Track shown costume IDs in state

### 7.5 Relaxation Messaging
Reference: [README.md §2](../README.md#2-what-happens-when-filters-are-too-restrictive)

- [ ] Banner: "You made this *hard*. We widened: Era + Universe."
- [ ] "Expanded" badges on affected cards
- [ ] "Loosen budget" / "Loosen effort" buttons if <3 results

---

## Phase 8: Design & Polish
**Duration:** ~4-6 hours

Reference: [README.md §5 UX Requirements](../README.md#5-ux-requirements-must-haves), [§9 Frontend Design System](../README.md#9-frontend-design-system-to-prevent-ai-look)

### 8.1 Editorial Design System
- [ ] Typography: magazine-style, confident
- [ ] Color palette: not generic AI purple/gradient
- [ ] No chat bubbles, no typing indicators, no robot disclaimers
- [ ] Copy tone: GQ / NYMag vibe, punchy and assertive

### 8.2 Mobile-First Polish
- [ ] Tap targets ≥ 44px per [§20](../README.md#20-accessibility)
- [ ] One question per screen
- [ ] Thumb-friendly slider interaction
- [ ] Test on iOS Safari (acceptance criteria)

### 8.3 Accessibility
Reference: [README.md §20](../README.md#20-accessibility)

- [ ] All interactive elements are semantic (`<button>`, proper labels)
- [ ] Sliders have visible labels + keyboard support
- [ ] Progress announced for screen readers
- [ ] Sufficient contrast (WCAG 2.1 AA)
- [ ] Visible focus states

---

## Phase 9: Testing
**Duration:** ~4-5 hours

Reference: [README.md §11 Testing Plan](../README.md#11-testing-plan)

### 9.1 Unit Tests
- [ ] Schema validation (valid + invalid inputs)
- [ ] Boundary filtering correctness
- [ ] Scoring function determinism
- [ ] Image resolver for each source type
- [ ] Relaxation ladder logic

### 9.2 Integration Tests
- [ ] `/api/recommend` always returns 3
- [ ] LLM failure returns fallback with 3
- [ ] `/api/more-like-this` always returns 5
- [ ] Boundaries always respected (fuzz test combinations)
- [ ] Rate limiting works

### 9.3 E2E Tests
- [ ] Full quiz flow on mobile viewport
- [ ] Quiz navigation (back button, progress)
- [ ] Refine actions update results
- [ ] Error states render correctly

### 9.4 Coverage Validation
- [ ] Run worst-case filter combinations against dataset
- [ ] Ensure relaxation produces results for edge cases

---

## Phase 10: Deployment & Launch
**Duration:** ~2-3 hours

### 10.1 Vercel Setup
- [ ] Connect repository
- [ ] Configure environment variables
- [ ] Enable Edge runtime for API routes (optional, for latency)

### 10.2 External Services
- [ ] TMDB API key provisioned
- [ ] Upstash Redis provisioned
- [ ] OpenAI API key provisioned

### 10.3 Pre-Launch Checklist
- [ ] All acceptance criteria pass per [README.md §10](../README.md#10-acceptance-criteria-prd-level):
  - [ ] Quiz completes with no errors on mobile Safari
  - [ ] Results always return 3 cards with images
  - [ ] Results always match boundaries
  - [ ] "More like this" always returns 5
  - [ ] LLM failure still returns deterministic recommendations
  - [ ] UI does not look like a chatbot or AI
- [ ] Performance budgets met per [§21](../README.md#21-performance-budget):
  - [ ] LCP < 2.5s on 4G
  - [ ] JS bundle < 200KB gzipped
- [ ] Attribution footer for TMDB images

### 10.4 Monitoring (Optional v1)
- [ ] Basic error logging (no PII, no photo data per [§10 Security](../README.md#10-security-privacy-compliance))
- [ ] Uptime monitoring

---

## Timeline Summary

| Phase | Description | Est. Hours |
|-------|-------------|------------|
| 0 | Project Setup | 2 |
| 1 | Schemas & Types | 3 |
| 2 | Dataset Creation | 8-12 |
| 3 | Backend Engine | 6-8 |
| 4 | LLM Integration | 5-6 |
| 5 | API Routes | 4-5 |
| 6 | Frontend Quiz | 8-10 |
| 7 | Frontend Results | 6-8 |
| 8 | Design & Polish | 4-6 |
| 9 | Testing | 4-5 |
| 10 | Deployment | 2-3 |

**Total: ~52-68 hours**

---

## Dependencies & Blockers

### External Dependencies
- TMDB API key (required before Phase 3.5)
- OpenAI API key (required before Phase 4)
- Upstash Redis account (required before Phase 5.1)

### Parallel Workstreams
- **Dataset creation (Phase 2)** can happen in parallel with Phases 1, 3, 4
- **Design mockups** can be created during Phase 0-2 to inform Phase 6-8

### Risk Items
1. **Dataset coverage** — May need more than 400 entries if filter combinations starve results
2. **TMDB image availability** — Some characters may not have good poster images
3. **LLM latency** — OpenAI response times vary; fallback path is critical
4. **Photo feature complexity** — Vision API adds latency; may simplify to skip/manual input

---

## Open Decisions for Implementation

1. **Photo upload implementation** — Use OpenAI Vision API, or simpler on-device detection?
2. **Fallback template variety** — Who writes the 10-15 copy variants?
3. **Dataset authoring** — One person or collaborative editing?
4. **Design system** — Use existing component library (shadcn/ui) or custom?

---

## Next Steps

1. **Run Phase 0** — Initialize project, set up structure
2. **Create starter dataset** — 50 costumes to unblock engine development
3. **Implement schemas** — Foundation for everything else
4. **Build filter/score engine** — Core logic independent of LLM

