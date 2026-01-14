# celeb

Below are the **final PRD** and **final Technical Design Document (TDD)**, updated to incorporate everything we discussed: **question-driven recommendations**, **images on results**, **web-image sourcing options**, **strong AI integration contracts**, **no login/no storage**, and a **non-AI-looking editorial design**. I’ve also included the kinds of implementation questions that normally pop up (and answered them in-spec).

---

# FINAL PRD — Costume Recommender Website

## 0) One-liner

A single-page, editorial-feeling quiz that recommends **3 specific celebrity/movie-character costumes** (with reference images + shopping list) based strictly on the user’s answers, then lets them refine with “more like this” without accounts or saving data.

---

## 1) Goals

### Primary Goals

1. Users finish the quiz in under **60 seconds**
2. Users receive **3 recommendations** that clearly tie back to their answers
3. Each recommendation includes a **reference image** (the “target look”)
4. Users can refine instantly: **More like this**, **More recognizable**, **Weirder**, **Easier**, **Hotter**, **Stylish-er**
5. The site feels like an **editorial quiz**, not an AI tool

### Secondary Goals

* The system is resilient (LLM errors don’t break UX)

---

## 2) Non-goals / Explicitly Out of Scope

* Accounts / sign-in
* Persisting quiz responses or results
* Social sharing (v1)
* Shopping checkout / affiliate links (v1)
* Image generation
* Real-time web scraping without a vetted source/licensing strategy
* “Chatbot” experience

---

## 3) User Stories (High-signal)

### Core

* As a user, I want to answer a few funny questions and get costume ideas I can actually do.
* As a user, I want the results to show a picture so I know what I’m aiming for.
* As a user, I want recommendations to match my vibe (funny/sexy/stylish/easy) and how niche I want to go.
* As a user, I want the site to avoid costumes that could be offensive or require skin tone changes.
* As a user, I want to refine results quickly without re-taking the quiz.

### Edge / Constraints

* As a user with low budget and low effort, I don’t want suggestions requiring expensive pieces, complex makeup, or custom props.
* As a user who selects “avoid wigs,” I don’t want any suggestion that requires a wig.
* As a user who selects “must survive a crowded bar,” I don’t want fragile costumes.

---

## 4) Information Architecture

### Single Route

* `/` = hero + quiz + results (same page, state-driven)
* No additional pages required for v1

### Sections

1. Hero intro (short, confident copy)
2. Quiz (progressive flow)
3. Results (3 cards)
4. Refinement panel (buttons)
5. Footer (tiny)

---

## 5) UX Requirements (must-haves)

### 5.1 Must Not Look Like AI

Hard requirements:

* No chat bubbles
* No “thinking…” or typing indicator
* No “AI assistant” language
* No robot disclaimers (“Based on your preferences…”)

Instead:

* Editorial quiz tone (GQ / NYMag vibe)
* Confident, punchy copy
* Static-feeling UI (like a magazine interactive)

### 5.2 Quiz Flow Rules

* One question per screen (or two max if short)
* Progress indicator: “7/12”
* Back button always available
* Skip optional questions
* Defaults:

  * Boundaries: “No skin tone change” ON by default

---

## 6) Content: Final Quiz Questions (Funny + Informative)

Each question maps directly to scoring/filtering. UI control type and data mapping included.

### Q1: Costume Objective (max 2)

**Prompt:** “If people remember one thing about your costume, it should be:”
**Control:** multi-select chips (max 2)
**Options:**

* Funny
* Hot
* Stylish
* Clever
* Low effort, high payoff
  **Maps to:** vibe weights

### Q2: Niche slider

**Prompt:** “How niche can we go before it stops being fun?”
**Control:** slider 1–10
**Labels:** 1 “Instantly recognized” — 10 “Deep cut”
**Maps to:** `nicheTarget`

### Q3: Effort truth serum

**Prompt:** “Be honest. How much effort are you *actually* putting in?”
**Control:** single select
**Options:**

* One iconic item, max
* A few pieces, fast
* I’ll commit if it pays off
* I’ll suffer for the bit
  **Maps to:** effort filter + scoring

### Q4: Budget

**Prompt:** “Costume budget (roughly):”
**Control:** single select
**Options:** `<$30`, `$30–$75`, `$75–$150`, “Don’t make me do math”
**Maps to:** budget filter + scoring

### Q5: Gender presentation

**Prompt:** “Should the character’s gender presentation match yours?”
**Control:** single select
**Options:** Yes / No / Don’t care
**Maps to:** soft/hard preference logic

### Q6: Look-alike vs vibe

**Prompt:** “Do you want a look-alike or just the vibe?”
**Control:** slider 1–10
**Labels:** 1 “Just the vibe” — 10 “Double take”
**Maps to:** resemblance scoring (hair/wig requirements)

### Q7: Universe

**Prompt:** “Where should we pull from?”
**Control:** multi-select
**Options:** Movies, TV, Music, Sports, Internet/memes, Surprise me
**Maps to:** universe filter + diversity constraints

### Q8: Era

**Prompt:** “Pick an era (or don’t):”
**Control:** single select
**Options:** 70s/80s, 90s, 2000s, Current, Doesn’t matter
**Maps to:** era scoring

### Q9: Boundaries (safety)

**Prompt:** “Anything we should avoid?”
**Control:** multi-select toggles
**Default ON:** “I won’t change my skin tone”
**Options:**

* I won’t change my skin tone (default ON)
* Avoid race/culture-specific costumes
* Avoid religious outfits/symbols
* Avoid political figures
* Avoid heavy makeup/face paint
* Avoid wigs
* Avoid anything controversial
  **Maps to:** hard filters

### Q10: Practical constraints

**Prompt:** “Real-world constraints:”
**Control:** multi-select toggles
**Options:**

* Must be comfortable all night
* Must survive a crowded bar
* Needs pockets (non-negotiable)
* Indoors only
  **Maps to:** comfort/bar/pockets scoring + filter

### Q11: Optional: “what do you already have?”

**Prompt:** “Anything you already own that you want to use?”
**Control:** multi-select “closet boosters” + optional text
**Common toggles:** leather jacket, sunglasses, suit, boots, dress, blazer
**Maps to:** prioritizes costumes matching owned items

### Q12: Optional photo

**Prompt:** “Want us to match hair/glasses/facial hair?”
**Control:** photo upload + “skip”
**Note:** “Not stored.”
**Maps to:** only if photo feature enabled; otherwise placeholder.

---

## 7) Results Requirements

### For each of the 3 recommendations show:

1. **Reference image** (“aim for this look”)
2. Title: “Morpheus (The Matrix)”
3. Difficulty badge: Easy/Medium/Hard
4. “Why it matches” bullets (2–3)

   * Must reference quiz signals (e.g., niche=3, effort=one item, avoids wigs)
5. “How to pull it off”:

   * Anchor item
   * Shopping list (3–7 items)
   * Substitutions (optional)
6. Warnings (optional)

   * “Only works if you commit to the sunglasses”

### Refinement Controls (always visible after results)

* “More like this” (on selected card)
* “More recognizable”
* “Weirder”
* “Easier”
* “Hotter”
* “Stylish-er”
* “Restart”

### Behavioral Rules

* “More like this” returns **5 more** using the chosen costume’s similarity tags
* “More recognizable/weirder” adjusts niche target +/- 2 with bounds (1–10)
* “Easier” reduces effort requirement one notch (if possible)
* Refinements do not reset all answers unless user hits Restart

---

## 8) Safety & Policy Product Requirements

* Never suggest changing skin tone
* If “avoid culture-specific” is selected, exclude any flagged costume
* Political figures excluded if boundary selected
* Any costume with face paint required excluded if “avoid face paint”
* If LLM tries to output disallowed content, server replaces with safe alternative and shows **no** alarming message

---

## 9) Analytics (v1 stance)

Default: **no analytics**.
If added later, must be:

* privacy-first
* event-only (quiz_completed, rec_clicked)
* no PII, no photo retention

---

## 10) Acceptance Criteria (PRD-level)

* Quiz completes with no errors on mobile Safari
* Results always return 3 cards with images
* Results always match boundaries
* “More like this” always returns 5
* LLM failure still returns deterministic recommendations
* UI does not look like a chatbot or AI

---

---

# FINAL TECHNICAL DESIGN DOCUMENT (TDD)

## 1) Architecture

### High-level

* Next.js app (frontend + API routes)
* Local, versioned costume dataset JSON
* Deterministic filter/scoring engine on server (or shared lib)
* LLM used for: ranking final 3 + generating editorial copy (strict contract)
* Image sourcing via external APIs (prefer structured, not raw web scraping)

### Statelessness

* No DB
* No persistent user identifiers
* No storing photo bytes
* In-memory caching only (optional)

---

## 2) Tech Stack (Implementation-ready)

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Optional: Framer Motion (only subtle transitions)

### Backend

* Next.js Route Handlers:

  * `POST /api/recommend`
  * `POST /api/more-like-this`
  * Optional: `POST /api/photo-features` (future)

### LLM Provider

* Any provider with JSON-mode / structured output
* Must support:

  * system+user messages
  * strict JSON schema adherence (or easy validation)
* Integrate via a single wrapper module (`/lib/llm.ts`)

### Hosting

* Vercel
* Env vars for LLM + image APIs keys

---

## 3) Data Standards & Versioning

### Dataset file

* `data/costumes.v1.json`
* Strict schema validated at build time and runtime

### Version rules

* IDs never change once shipped
* Additive changes preferred
* If breaking change: bump major dataset version

---

## 4) Schemas (Canonical)

### 4.1 Costume Schema (final)

Add explicit image pointers to support images without storing them.

```ts
type ImageSource =
  | { kind: "tmdb"; tmdbId: number; imagePath: string; imageType: "poster" | "backdrop" }
  | { kind: "wikimedia"; fileTitle: string; pageUrl?: string }
  | { kind: "manual"; url: string; attribution?: string };

type Costume = {
  id: string; // "cos_morpheus_matrix"
  name: string; // "Morpheus"
  displayTitle: string; // "Morpheus (The Matrix)"
  universe: "movie" | "tv" | "music" | "sports" | "internet";
  sourceTitle?: string;
  era: "70s_80s" | "90s" | "2000s" | "current" | "any";

  vibes: {
    funny: 0|1|2|3;
    sexy: 0|1|2|3;
    stylish: 0|1|2|3;
    clever: 0|1|2|3;
    lowEffortHighPayoff: 0|1|2|3;
  };

  nicheScore: 1|2|3|4|5|6|7|8|9|10; // higher = more niche

  genderPresentation: "masc" | "femme" | "androgynous" | "flexible";

  constraints: {
    effort: "one_item" | "few_fast" | "some_work" | "suffer_for_bit";
    budget: "lt_30" | "30_75" | "75_150" | "dont_care";
    comfort: "high" | "medium" | "low";
    barFriendly: boolean;
    pocketsLikely: boolean;
  };

  requirements: {
    anchorItem: string;
    items: string[]; // 3–10 canonical items
    makeupLevel: "none" | "light" | "heavy";
    wigRequired: boolean;
    facePaintRequired: boolean;
    propsLevel: "none" | "optional" | "required";
  };

  safety: {
    cultureSpecific: boolean;
    religiousAttire: boolean;
    politicalFigure: boolean;
    controversial: boolean;
    skinToneChangeImplied: boolean; // should basically never be true; used as failsafe
  };

  similarity: {
    archetypeTags: string[]; // e.g., ["suit", "sunglasses", "cool", "minimalist"]
    vibeTags: string[]; // e.g., ["stylish", "recognizable"]
  };

  images: {
    primary: ImageSource;
    alternatives?: ImageSource[];
  };

  notes?: string; // short editorial hint used by LLM
};
```

### 4.2 Quiz Schema (final)

```ts
type QuizResponse = {
  goals: Array<"funny"|"sexy"|"stylish"|"clever"|"lowEffortHighPayoff">; // max 2
  nicheTarget: 1|2|3|4|5|6|7|8|9|10;
  effort: "one_item"|"few_fast"|"some_work"|"suffer_for_bit";
  budget: "lt_30"|"30_75"|"75_150"|"dont_care";

  genderPref: "match"|"dont_match"|"dont_care";
  resemblanceTarget: 1|2|3|4|5|6|7|8|9|10;

  universes: Array<"movie"|"tv"|"music"|"sports"|"internet">;
  era: "70s_80s"|"90s"|"2000s"|"current"|"any";

  boundaries: {
    noSkinToneChange: boolean; // default true
    avoidCultureSpecific: boolean;
    avoidReligious: boolean;
    avoidPolitical: boolean;
    avoidFacePaint: boolean;
    avoidWigs: boolean;
    avoidControversial: boolean;
  };

  practical: {
    mustBeComfortable: boolean;
    mustSurviveCrowdedBar: boolean;
    needsPockets: boolean;
    indoorOnly: boolean;
  };

  closetBoosters?: {
    hasLeatherJacket?: boolean;
    hasSunglasses?: boolean;
    hasSuit?: boolean;
    hasBoots?: boolean;
    hasDress?: boolean;
    hasBlazer?: boolean;
  };

  notes?: string;
};
```

### 4.3 Recommendation API Output Schema (final)

Includes resolved image URL(s) so the client is dumb and fast.

```ts
type Recommendation = {
  costumeId: string;
  title: string; // display title from dataset
  image: {
    url: string;
    attributionText?: string;
    attributionLink?: string;
  };
  whyItMatches: string[]; // 2-3 bullets referencing quiz choices
  difficulty: "Easy"|"Medium"|"Hard";
  anchorItem: string;
  shoppingList: string[]; // 3-7
  substitutions?: string[];
  warnings?: string[];
  similarityTags: string[]; // for more-like-this
};

type RecommendResponse = {
  recommendations: [Recommendation, Recommendation, Recommendation];
  meta: {
    datasetVersion: string;
    mode: "llm" | "fallback";
  };
};
```

---

## 5) Image Strategy (answers your “web search or stored?” question)

### 5.1 Default: Store pointers, not images

You do **not** store image files. You store **image pointers** in the dataset (TMDB ID, Wikimedia file title, or a manual URL).

### 5.2 Priority order (recommended)

1. **TMDB** for movie/TV characters
2. **Wikimedia Commons** for some public figures / iconic images
3. **Manual URLs** only if you have rights/permission or use your own hosted assets

### 5.3 “Can AI search the web for images?”

You *can*, but it’s usually a trap in v1:

* unstable results
* licensing ambiguity
* harder to guarantee safe content

**If you want a true open-web mode**, implement it later behind a flag:

* use a legitimate search API
* only allow sources that provide licensing metadata
* cache results and maintain a blocklist

### 5.4 Image resolution rules

* Use consistent aspect ratio on result cards (e.g., 2:3 poster-style)
* Use blurred background placeholder while loading
* Always have a fallback image if source fails

---

## 6) Recommendation Engine (Deterministic + LLM)

### 6.1 Deterministic filter (hard constraints)

Applied before LLM is called.

**Exclude if:**

* boundaries conflict with safety flags:

  * avoidCultureSpecific && costume.safety.cultureSpecific
  * avoidReligious && costume.safety.religiousAttire
  * avoidPolitical && costume.safety.politicalFigure
  * avoidControversial && costume.safety.controversial
* avoidWigs && wigRequired
* avoidFacePaint && facePaintRequired
* noSkinToneChange && skinToneChangeImplied (failsafe)
* universes selected and costume.universe not in selection (unless “Surprise me” chosen)
* indoorOnly and costume requires outdoor-specific gear (optional field if added later)

### 6.2 Scoring (soft constraints)

A weighted score from:

* vibe match:

  * take selected goals, weight them strongly
* niche match:

  * score = 1 - abs(nicheScore - nicheTarget)/9
* effort/budget fit:

  * exact match bonus, within-one-level bonus, mismatch penalty
* practical:

  * mustBeComfortable → boost comfort=high
  * mustSurviveCrowdedBar → boost barFriendly=true
  * needsPockets → boost pocketsLikely=true
* closet boosters:

  * if user has sunglasses → boost costumes that list sunglasses in items or archetypeTags

### 6.3 Candidate shortlist

* Take top **N=20** scored costumes
* Enforce diversity in candidates:

  * at least 2 different archetypeTags among top 10 if possible

### 6.4 LLM Stage (bounded selection + copy)

LLM receives:

* quiz answers
* top 20 candidates (IDs + minimal metadata + requirements + notes)

LLM must:

* return exactly **3** from candidate IDs only
* generate copy and lists in required style
* return strict JSON

---

## 7) AI Integration (detailed)

### 7.1 LLM Prompt Contract (implementation requirements)

**System message rules (conceptual):**

* “You are an editorial stylist. No mention of AI. No hedging. No first-person.”
* “You can only select from `candidateCostumeIds`.”
* “Output strict JSON matching schema. No extra keys. No markdown.”

**User payload:**

* `quiz`: QuizResponse
* `candidates`: array of { costumeId, displayTitle, vibes summary, constraints, requirements, similarity tags, notes }
* `styleGuide`: bullet rules for tone and forbidden phrases

### 7.2 Forbidden phrases list (hard)

Reject outputs containing:

* “Based on your preferences”
* “As an AI”
* “I think”
* “I recommend”
* “You might like”
  Instead require assertive editorial tone:
* “This hits your ___”
* “This is the cleanest way to get ___”

### 7.3 Structured output validation

* Parse JSON
* Validate via Zod
* Verify each `costumeId` is in candidates
* Verify boundaries again post-generation (belt + suspenders)

### 7.4 Fallback generation (no LLM)

If LLM fails:

* pick top 3 deterministically
* generate copy using templates:

  * WhyItMatches uses quiz values explicitly
  * Shopping list uses costume.requirements.items

Return `meta.mode = "fallback"`

---

## 8) API Design

### 8.1 `POST /api/recommend`

**Input:** QuizResponse
**Process:**

1. load dataset
2. filter + score + shortlist
3. call LLM for final 3 + copy (or fallback)
4. resolve image URLs (TMDB/Wikimedia/manual)
5. return RecommendResponse

### 8.2 `POST /api/more-like-this`

**Input:**

```ts
{ selectedCostumeId: string; quiz: QuizResponse; direction?: "more_recognizable"|"weirder"|"easier"|"hotter"|"stylisher"; }
```

**Output:** `{ recommendations: Recommendation[] }` with exactly 5

**Logic:**

* Start from selected costume similarityTags + archetypeTags
* Apply same boundaries filters
* Apply direction adjustment:

  * more_recognizable → nicheTarget -= 2
  * weirder → nicheTarget += 2
  * easier → effort down one notch
  * hotter → add weight to sexy
  * stylisher → add weight to stylish
* Score and return top 5 not previously shown

### 8.3 Image resolving functions

* `resolveImage(costume.images.primary) -> {url, attributionText?, attributionLink?}`
* TMDB requires a configuration fetch or known base URL sizes; cache config in memory with TTL (e.g., 24h)

---

## 9) Frontend Design System (to prevent “AI look”)

### 9.1 Components

* `Hero`
* `QuizStepper` (progress, back)
* `QuestionCard`
* `ChoiceChips`
* `Slider`
* `ToggleList`
* `ResultsGrid`
* `RecommendationCard`
* `RefineBar`

### 9.2 Interaction rules

* Transitions: simple fade/slide (150–250ms)
* No dynamic “assistant” animations
* No bouncing loaders; use a calm skeleton card layout

### 9.3 Copy rules

* Every screen has one short headline + one funny supportive subline
* Buttons are short (“Commit”, “Keep it easy”, “Make it weird”)

---

## 10) Security, Privacy, Compliance

### No storage pledge (enforced)

* Do not write quiz payloads to logs
* On server, mask/omit request bodies in error logs
* If photo is added later:

  * do not log image
  * discard bytes immediately after feature extraction

### Rate limiting

* Add basic rate limiting per IP for API routes (prevents key abuse)
* e.g., 30 requests / 10 minutes (tune later)

---

## 11) Testing Plan

### Unit tests

* schema validation
* boundary filtering correctness
* scoring function determinism
* image resolver for each source type

### Integration tests

* `/api/recommend` returns 3 always
* LLM failure returns fallback with 3
* `/api/more-like-this` returns 5 always
* boundaries always respected

### UI tests

* mobile layout
* quiz navigation
* refine actions update results

---

## 12) Implementation Questions (and decisions in-spec)

### Q: Do we need the AI to “search the web” for costumes?

**Decision:** No for v1. Use a curated dataset to prevent nonsense and ensure safety. Expand dataset over time.

### Q: How do we ensure results are “based on the questions”?

**Decision:** Deterministic filter + scoring shortlist + LLM bounded to candidates, plus “why it matches” bullets that must reference quiz choices.

### Q: What if an image source fails?

**Decision:** Provide fallback:

* try `images.alternatives`
* else show a neutral placeholder and keep the rec

### Q: How do we avoid duplicates across “more like this”?

**Decision:** Client maintains a list of shown costumeIds in memory and sends it with refine calls (or server filters by excluding IDs in request).

### Q: Should we store anything in localStorage?

**Decision:** No (v1). Keep state in memory only.

### Q: How large should dataset be?

**Decision:** Start with 100–200 entries. Enough variety for “funny/sexy/stylish/easy” across universes. Expand.

### Q: What about explicit/inappropriate costumes?

**Decision:** Include a `controversial` flag and default user boundary includes “no skin tone change.” Also provide `avoidControversial` toggle; if selected, hard-filter them.

---

## 13) Directory Structure (final)

```
/app
  page.tsx
  /api
    /recommend/route.ts
    /more-like-this/route.ts
/components
  Hero.tsx
  QuizStepper.tsx
  QuestionCard.tsx
  ChoiceChips.tsx
  Slider.tsx
  ToggleList.tsx
  ResultsGrid.tsx
  RecommendationCard.tsx
  RefineBar.tsx
/data
  costumes.v1.json
/lib
  schema.ts        // zod + TS types
  filter.ts        // hard constraint filters
  score.ts         // scoring + shortlist
  diversify.ts     // diversity rules
  llm.ts           // provider wrapper
  prompts.ts       // prompt templates + forbidden phrase guard
  images.ts        // resolve TMDB/Wikimedia/manual
  fallback.ts      // template-based recommendation output
/styles
  globals.css
```

Got it. Here are **direct answers + concrete decisions** for each item, updated with: **photo upload is required in v1** and **mobile web is the primary experience**.

---

## From the User’s Perspective

### 1) Q12 (Photo Upload) — show it in v1?

**Decision: YES, show it and use it in v1.**
It would be confusing otherwise.

**How it’s used (v1 scope):** extract only **light “fit cues”** to improve matching:

* `glassesLikely` (true/false)
* `facialHairLikely` (true/false)
* `hairLength` (short/medium/long/unknown)

**UI copy (mobile-friendly, non-creepy):**

* “Optional, but it makes your picks better.”
* “We don’t store your photo.”

**Implementation note:** do *not* do face recognition or “lookalike to celeb.” Just these basic cues.

---

### 2) What happens when filters are too restrictive?

**Decision: Never show 0 results.** We implement a **Relaxation Ladder** + transparent messaging.

**Relaxation Ladder (in order):**

1. Keep all **boundaries** (culture/religious/political/skin tone) **strict** (never relax).
2. Relax **era** constraint (treat as soft preference).
3. Expand **universe** if user selected only one (ask permission via toggle: “Open it up?”) OR auto-expand to closest adjacent (Sports → Movies/TV sports characters) with a badge “Expanded”.
4. Relax **budget** upward one tier (only if user chooses “ok” via one-tap prompt).
5. Relax **effort** upward one tier (again, user chooses).

**UX when pool is tiny (<5):**

* Show a banner:
  “You made this *hard* (respect). We widened: Era + Universe.”
* Show results with a small “Expanded” label so it feels intentional, not broken.

**If still <3 after safe relaxations:**

* Show “Closest matches” (still safe) + a one-tap “Loosen budget” / “Loosen effort” button.

---

### 3) Slider granularity (1–10 vs simpler)

**Decision: Use 1–7 for mobile**, not 1–10.

Why: easier thumb control + meaningful steps.

**Labels (shown under slider):**
1 = “Everyone gets it”
4 = “Some people get it”
7 = “Deep cut”

Same for resemblance: 1–7.

---

### 4) Refinement asymmetry (3 cards vs 5)

**Decision: Intentional.**

* Initial = **3** (fast, clean, less scrolling)
* “More like this” = **5** (gives variety once user indicates preference)

**UI behavior:**

* Results section stays the same.
* After user taps a card, it becomes “Selected.”
* The **5 more** appear as a “More like this” carousel/grid *below* (not replacing the original 3).

---

### 5) Can refinements stack?

**Decision: Yes, refinements stack** (it’s what users expect).

**Rule:** refinements update a `derivedQuizState` from the original quiz.

* User’s original answers remain the baseline
* Each refinement updates a derived state and refreshes results
* Provide a small “Reset tweaks” link to go back to pure baseline

---

## From the Implementation Perspective

### 6) 100–200 costumes vs filter explosion

**Decision: Start with 250–400 entries for v1** (not 100–200) because photo + boundaries + universe + effort + budget reduces pools quickly.

Also: implement the **Relaxation Ladder** above so strict combos don’t fail.

We don’t need a full simulation model before v1, but we should run a quick script locally to test coverage for:

* each universe + effort + budget + avoid wigs/face paint
* worst-case combinations

---

### 7) Who curates the dataset?

**Decision: v1 is hand-curated JSON + a simple validation script.**
No admin tool in v1.

**Post-launch additions:**

* Edit JSON in repo
* Run `npm run validate-dataset` (schema + duplicate checks + missing images)
* Deploy

Optional v1.1: a tiny internal “add costume” form that outputs JSON (still no DB).

---

### 8) TMDB / Wikimedia image pointers (keys, limits, attribution)

**Decision: Use TMDB for movie/TV by default. Wikimedia as secondary.**

* Yes, we need a TMDB API key.
* Show minimal attribution in footer: “Images via TMDB” when TMDB sources are used.
* Cache TMDB config (base URLs) in-memory with 24h TTL to reduce calls.

Wikimedia:

* No key required in many cases, but be respectful with rate limiting.
* If we use Wikimedia images, include attribution per file when required.

---

## LLM Integration

### 9) Which provider?

**Decision: OpenAI for v1** (best combination of structured output, ecosystem, reliability).
Wrapper still abstracted so you can swap later.

**Reasoning:** We need strict JSON output + low latency. OpenAI’s structured output support is strong for this use case.

---

### 10) Latency budget

**Decision: Target p95 = 3.5s from “Submit” → cards rendered on mobile.**

* Ideal p50: 1.5–2.5s

**Implementation choices to hit this:**

* One LLM call only (no multi-step)
* Deterministic scoring happens locally in <50ms
* Do not stream (streaming makes it feel “AI-y”)
* Use skeleton cards while loading

Timeouts:

* LLM call hard timeout at ~6–8s then fallback.

---

### 11) Fallback copy quality

**Decision: Yes, we must write fallback templates now.**
Fallback should feel editorial, not robotic.

Approach:

* Templates use quiz signals explicitly:

  * “Low-effort + stylish: this is basically a jacket and one detail.”
* Pull shopping list directly from dataset.
* Use a small set of varied phrasing templates (10–15 variants) to avoid repetition.

---

## State & Architecture

### 12) Rate limiting storage (Vercel instances)

**Decision: Use Upstash Redis** (or Vercel KV) for real rate limiting.
Per-instance memory-only is too weak if keys are exposed.

**Rate limit policy:**

* `/api/recommend`: 30 req / 10 min / IP
* `/api/more-like-this`: 60 req / 10 min / IP
* Burst control: 5 requests / 10 seconds

---

### 13) Dataset loading

**Decision: Load server-side and cache in module scope.**

* Read JSON once per warm instance
* Validate on boot (in dev) or during build

Do *not* bundle full dataset client-side (keeps bundle small).

---

### 14) Client state management

**Decision: plain React state + a reducer** (no external state library).

* `useReducer` for quiz answers and derived tweaks
* Keep URL state minimal, but support back button logically:

  * use a `step` query param optional (`?step=5`) OR use History API to push steps (recommended)

Mobile UX: back button should go to previous question, not exit.

---

### 15) “No localStorage” vs refresh loses everything

**Decision: Allow sessionStorage in v1 (not localStorage).**

* Session-only persistence improves UX on mobile where refreshes happen.
* Still aligns with “no saving data” philosophy (clears when tab closes).

We store only:

* quiz answers
* derived tweaks
* shown costume IDs
  No photo stored.

---

## Edge Cases

### 16) LLM returns invalid costume IDs

**Decision: Do not retry unless fast.**
Recovery steps:

1. Validate JSON
2. If IDs invalid or not in candidates → **fallback deterministic top 3 immediately**
3. Return `meta.mode="fallback"`

No retry by default (retries increase latency + cost).

---

### 17) Image fallback cascade & placeholder

**Decision: Card always renders.**
If image fails:

* show a neutral placeholder: “Reference image unavailable”
* keep title + checklist visible
* add a “Search it” outbound link button (optional) **only if you’re okay linking out**; otherwise omit.

Placeholder design:

* editorial gray block with a tiny icon, not a broken-image icon

---

### 18) Characters with non-human skin (Gamora, Avatar, etc.)

**Decision: Allowed but gated.**
We should not treat these as “skin tone change” in the same category as race.

Implementation:

* Add field: `requiresBodyPaintOrFullFacePaint: boolean`
* If user selects “avoid face paint” → exclude
* Otherwise allow, but include warning:

  * “This needs body/face paint—commit or skip.”

Do **not** mark them as `skinToneChangeImplied` (that field is for *disallowed* suggestions).

---

## Missing Specs

### 19) Error UX (API failure)

**Decision: Provide a graceful offline-friendly experience.**
If `/api/recommend` fails:

* show message:
  “We couldn’t load your picks. Want to try again or loosen constraints?”
* Buttons:

  * “Retry”
  * “Make it easier”
  * “Restart”

If repeated failure:

* offer “Manual mode”: show top 12 “starter costumes” from dataset filtered by boundaries only.

---

### 20) Accessibility

**Decision: Target WCAG 2.1 AA for core flows.**
Minimum requirements:

* All buttons are real `<button>` elements
* Sliders have labels and keyboard support
* Progress announced for screen readers
* Sufficient contrast
* Focus states visible
* Tap targets ≥ 44px on mobile

---

### 21) Performance budget

**Decisions (mobile-first):**

* LCP target: < 2.5s on 4G
* JS bundle: keep initial < 200KB gz if possible
* Dataset not shipped to client
* Use `next/image` with proper sizing
* Skeleton UI for results

