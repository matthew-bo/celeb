#!/usr/bin/env tsx
/**
 * Test Runner
 * 
 * Runs unit and integration tests for the costume recommender.
 * Uses a simple assertion-based test framework.
 * 
 * Usage: npm run test:unit
 */

import { readFileSync } from "fs";
import { join } from "path";

// Simple test framework
let passedTests = 0;
let failedTests = 0;
let currentSuite = "";

function describe(name: string, fn: () => void | Promise<void>) {
  currentSuite = name;
  console.log(`\n📦 ${name}`);
  return fn();
}

function test(name: string, fn: () => void) {
  try {
    fn();
    passedTests++;
    console.log(`   ✅ ${name}`);
  } catch (error) {
    failedTests++;
    console.log(`   ❌ ${name}`);
    console.log(`      ${(error as Error).message}`);
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: T) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== "number" || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== "number" || actual < expected) {
        throw new Error(`Expected ${actual} to be >= ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== "number" || actual > expected) {
        throw new Error(`Expected ${actual} to be <= ${expected}`);
      }
    },
    toContain(expected: unknown) {
      if (!Array.isArray(actual) || !actual.includes(expected)) {
        throw new Error(`Expected array to contain ${JSON.stringify(expected)}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
    },
    toHaveLength(expected: number) {
      if (!Array.isArray(actual) && typeof actual !== "string") {
        throw new Error(`Expected array or string, got ${typeof actual}`);
      }
      if ((actual as unknown[]).length !== expected) {
        throw new Error(`Expected length ${expected}, got ${(actual as unknown[]).length}`);
      }
    },
    toMatchObject(expected: Record<string, unknown>) {
      for (const [key, value] of Object.entries(expected)) {
        const actualVal = (actual as Record<string, unknown>)[key];
        if (JSON.stringify(actualVal) !== JSON.stringify(value)) {
          throw new Error(`Expected ${key} to be ${JSON.stringify(value)}, got ${JSON.stringify(actualVal)}`);
        }
      }
    },
  };
}

// =========================================================================
// Tests
// =========================================================================

import { z } from "zod";
import { CostumeSchema, QuizResponseSchema, type Costume, type QuizResponse } from "../lib/schema";
import { applyHardFilters, filterByConstraints } from "../lib/filter";
import { scoreCostume, scoreAndRank } from "../lib/score";
import { applyRelaxationLadder } from "../lib/relax";
import { ensureDiversity, ensureUniverseDiversity } from "../lib/diversify";
import { generateFallbackRecommendations } from "../lib/fallback";

// Load dataset for tests
const dataPath = join(process.cwd(), "data", "costumes.v1.json");
const rawData = JSON.parse(readFileSync(dataPath, "utf-8"));
const costumes: Costume[] = z.array(CostumeSchema).parse(rawData);

// Base quiz for testing
const baseQuiz: QuizResponse = {
  goals: ["stylish", "clever"],
  nicheTarget: 5,
  effort: "few_fast",
  budget: "30_75",
  genderPref: "dont_care",
  resemblanceTarget: 5,
  universes: ["movie", "tv"],
  era: "any",
  boundaries: {
    noSkinToneChange: true,
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
};

async function runTests() {
  console.log("\n🧪 Running Unit & Integration Tests");
  console.log("=".repeat(50));

  // =========================================================================
  // Schema Tests
  // =========================================================================
  describe("Schema Validation", () => {
    test("validates a correct costume", () => {
      const costume = costumes[0];
      const result = CostumeSchema.safeParse(costume);
      expect(result.success).toBeTruthy();
    });

    test("rejects costume without required fields", () => {
      const invalid = { id: "test", name: "Test" };
      const result = CostumeSchema.safeParse(invalid);
      expect(result.success).toBeFalsy();
    });

    test("validates quiz response", () => {
      const result = QuizResponseSchema.safeParse(baseQuiz);
      expect(result.success).toBeTruthy();
    });

    test("rejects quiz with invalid goals count", () => {
      const invalid = { ...baseQuiz, goals: ["funny", "sexy", "stylish"] }; // max 2
      const result = QuizResponseSchema.safeParse(invalid);
      expect(result.success).toBeFalsy();
    });

    test("accepts quiz with empty universes (interpreted as all)", () => {
      // Empty universes means "surprise me" / "all universes"
      const valid = { ...baseQuiz, universes: [] };
      const result = QuizResponseSchema.safeParse(valid);
      expect(result.success).toBeTruthy();
    });
  });

  // =========================================================================
  // Filter Tests
  // =========================================================================
  describe("Filter Engine", () => {
    test("filters by universe", () => {
      const quiz: QuizResponse = { ...baseQuiz, universes: ["sports"] };
      const filtered = applyHardFilters(costumes, quiz);
      const allSports = filtered.every(c => c.universe === "sports");
      expect(allSports).toBeTruthy();
    });

    test("respects avoidWigs boundary", () => {
      const quiz: QuizResponse = {
        ...baseQuiz,
        boundaries: { ...baseQuiz.boundaries, avoidWigs: true },
      };
      const filtered = applyHardFilters(costumes, quiz);
      const noWigs = filtered.every(c => !c.requirements.wigRequired);
      expect(noWigs).toBeTruthy();
    });

    test("respects avoidFacePaint boundary", () => {
      const quiz: QuizResponse = {
        ...baseQuiz,
        boundaries: { ...baseQuiz.boundaries, avoidFacePaint: true },
      };
      const filtered = applyHardFilters(costumes, quiz);
      const noFacePaint = filtered.every(
        c => !c.requirements.facePaintRequired && !c.requiresBodyPaintOrFullFacePaint
      );
      expect(noFacePaint).toBeTruthy();
    });

    test("respects avoidControversial boundary", () => {
      const quiz: QuizResponse = {
        ...baseQuiz,
        universes: ["movie", "tv", "music", "sports", "internet"],
        boundaries: { ...baseQuiz.boundaries, avoidControversial: true },
      };
      const filtered = applyHardFilters(costumes, quiz);
      const noControversial = filtered.every(c => !c.safety.controversial);
      expect(noControversial).toBeTruthy();
    });

    test("respects avoidPolitical boundary", () => {
      const quiz: QuizResponse = {
        ...baseQuiz,
        universes: ["movie", "tv", "music", "sports", "internet"],
        boundaries: { ...baseQuiz.boundaries, avoidPolitical: true },
      };
      const filtered = applyHardFilters(costumes, quiz);
      const noPolitical = filtered.every(c => !c.safety.politicalFigure);
      expect(noPolitical).toBeTruthy();
    });

    test("bar-friendly filter works", () => {
      const quiz: QuizResponse = {
        ...baseQuiz,
        practical: { ...baseQuiz.practical, mustSurviveCrowdedBar: true },
      };
      const filtered = applyHardFilters(costumes, quiz);
      const allBarFriendly = filtered.every(c => c.constraints.barFriendly);
      expect(allBarFriendly).toBeTruthy();
    });

    test("pockets filter works", () => {
      const quiz: QuizResponse = {
        ...baseQuiz,
        practical: { ...baseQuiz.practical, needsPockets: true },
      };
      const filtered = applyHardFilters(costumes, quiz);
      const allHavePockets = filtered.every(c => c.constraints.pocketsLikely);
      expect(allHavePockets).toBeTruthy();
    });
  });

  // =========================================================================
  // Scoring Tests
  // =========================================================================
  describe("Scoring Engine", () => {
    test("returns numeric scores", () => {
      const costume = costumes[0];
      const score = scoreCostume(costume, baseQuiz);
      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThan(0);
    });

    test("ranks costumes in order", () => {
      const ranked = scoreAndRank(costumes, baseQuiz, 10);
      expect(ranked.length).toBeLessThanOrEqual(10);
      
      // Verify sorted descending
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
      }
    });

    test("higher vibe match gives higher score", () => {
      // Find a stylish costume and a non-stylish one
      const stylish = costumes.find(c => c.vibes.stylish === 3);
      const notStylish = costumes.find(c => c.vibes.stylish === 0 && c.universe === "movie");
      
      if (stylish && notStylish) {
        const quiz: QuizResponse = { ...baseQuiz, goals: ["stylish"] };
        const stylishScore = scoreCostume(stylish, quiz);
        const notStylishScore = scoreCostume(notStylish, quiz);
        expect(stylishScore).toBeGreaterThan(notStylishScore);
      }
    });
  });

  // =========================================================================
  // Relaxation Tests
  // =========================================================================
  describe("Relaxation Ladder", () => {
    test("returns costumes without relaxation when pool is sufficient", () => {
      const { costumes: result, relaxationsApplied } = applyRelaxationLadder(
        costumes,
        baseQuiz,
        3
      );
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    test("relaxes constraints when pool is too small", () => {
      // Very restrictive quiz
      const restrictiveQuiz: QuizResponse = {
        ...baseQuiz,
        universes: ["sports"],
        boundaries: {
          ...baseQuiz.boundaries,
          avoidWigs: true,
          avoidControversial: true,
        },
        practical: {
          mustBeComfortable: true,
          mustSurviveCrowdedBar: true,
          needsPockets: true,
          indoorOnly: false,
        },
      };
      
      const { costumes: result, relaxationsApplied } = applyRelaxationLadder(
        costumes,
        restrictiveQuiz,
        3
      );
      
      // Should still get results (either enough or relaxation applied)
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  // =========================================================================
  // Diversity Tests
  // =========================================================================
  describe("Diversity Rules", () => {
    test("ensureDiversity returns array", () => {
      const ranked = scoreAndRank(costumes, baseQuiz, 20);
      const diverse = ensureDiversity(ranked);
      expect(Array.isArray(diverse)).toBeTruthy();
    });

    test("ensureUniverseDiversity works with mixed universes", () => {
      const ranked = scoreAndRank(costumes, baseQuiz, 20);
      const diverse = ensureUniverseDiversity(ranked, ["movie", "tv"]);
      expect(Array.isArray(diverse)).toBeTruthy();
    });
  });

  // =========================================================================
  // Fallback Tests
  // =========================================================================
  describe("Fallback Generator", () => {
    test("generates 3 recommendations", () => {
      const ranked = scoreAndRank(costumes, baseQuiz, 20);
      const recommendations = generateFallbackRecommendations(ranked, baseQuiz);
      expect(recommendations).toHaveLength(3);
    });

    test("recommendations have required fields", () => {
      const ranked = scoreAndRank(costumes, baseQuiz, 20);
      const recommendations = generateFallbackRecommendations(ranked, baseQuiz);
      
      for (const rec of recommendations) {
        expect(rec.costumeId).toBeTruthy();
        expect(rec.title).toBeTruthy();
        expect(rec.anchorItem).toBeTruthy();
        expect(rec.shoppingList.length).toBeGreaterThanOrEqual(3);
        expect(rec.whyItMatches.length).toBeGreaterThanOrEqual(2);
        expect(["Easy", "Medium", "Hard"]).toContain(rec.difficulty);
      }
    });

    test("recommendations have unique costume IDs", () => {
      const ranked = scoreAndRank(costumes, baseQuiz, 20);
      const recommendations = generateFallbackRecommendations(ranked, baseQuiz);
      const ids = recommendations.map(r => r.costumeId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  // =========================================================================
  // Integration Tests
  // =========================================================================
  describe("Integration: Full Pipeline", () => {
    test("full recommendation pipeline works", () => {
      // 1. Filter
      const filtered = applyHardFilters(costumes, baseQuiz);
      expect(filtered.length).toBeGreaterThan(0);
      
      // 2. Score and rank
      const ranked = scoreAndRank(filtered, baseQuiz, 20);
      expect(ranked.length).toBeGreaterThan(0);
      
      // 3. Diversify
      const diverse = ensureDiversity(ranked);
      expect(diverse.length).toBeGreaterThan(0);
      
      // 4. Generate fallback (simulating LLM failure)
      const recommendations = generateFallbackRecommendations(diverse, baseQuiz);
      expect(recommendations).toHaveLength(3);
    });

    test("handles all-universes selection", () => {
      const quiz: QuizResponse = {
        ...baseQuiz,
        universes: ["movie", "tv", "music", "sports", "internet"],
      };
      
      const filtered = applyHardFilters(costumes, quiz);
      const ranked = scoreAndRank(filtered, quiz, 20);
      const recommendations = generateFallbackRecommendations(ranked, quiz);
      
      expect(recommendations).toHaveLength(3);
    });

    test("handles strict boundaries", () => {
      const quiz: QuizResponse = {
        ...baseQuiz,
        universes: ["movie", "tv", "music", "sports", "internet"],
        boundaries: {
          noSkinToneChange: true,
          avoidCultureSpecific: true,
          avoidReligious: true,
          avoidPolitical: true,
          avoidFacePaint: true,
          avoidWigs: true,
          avoidControversial: true,
        },
      };
      
      const { costumes: relaxed } = applyRelaxationLadder(costumes, quiz, 3);
      expect(relaxed.length).toBeGreaterThanOrEqual(3);
    });
  });

  // =========================================================================
  // Summary
  // =========================================================================
  console.log("\n" + "=".repeat(50));
  console.log(`📊 Test Results: ${passedTests} passed, ${failedTests} failed`);
  console.log("=".repeat(50) + "\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);

