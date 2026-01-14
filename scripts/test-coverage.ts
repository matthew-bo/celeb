#!/usr/bin/env tsx
/**
 * Dataset Coverage Test
 * 
 * Tests various filter combinations to ensure all reasonable user choices
 * return at least 3 results (enough for the initial recommendation).
 * 
 * Reference: README.md §6 - need 250-400 entries for filter coverage
 * 
 * Usage: npm run test-coverage
 */

import { readFileSync } from "fs";
import { join } from "path";
import { CostumeSchema, type Costume, type QuizResponse } from "../lib/schema";
import { applyHardFilters } from "../lib/filter";
import { applyRelaxationLadder } from "../lib/relax";
import { z } from "zod";

// Load dataset
const dataPath = join(process.cwd(), "data", "costumes.v1.json");
const rawData = JSON.parse(readFileSync(dataPath, "utf-8"));
const costumes: Costume[] = z.array(CostumeSchema).parse(rawData);

console.log(`\n📊 Dataset Coverage Test`);
console.log(`========================`);
console.log(`Total costumes in dataset: ${costumes.length}\n`);

// Define test matrix
const universes: QuizResponse["universes"][] = [
  ["movie"],
  ["tv"],
  ["music"],
  ["sports"],
  ["internet"],
  ["movie", "tv"],
  ["movie", "tv", "music", "sports", "internet"], // All
];

const efforts: QuizResponse["effort"][] = [
  "one_item",
  "few_fast",
  "some_work",
  "suffer_for_bit",
];

const budgets: QuizResponse["budget"][] = [
  "lt_30",
  "30_75",
  "75_150",
  "dont_care",
];

const boundaryConfigs = [
  { name: "Default (skin tone only)", config: { noSkinToneChange: true, avoidCultureSpecific: false, avoidReligious: false, avoidPolitical: false, avoidFacePaint: false, avoidWigs: false, avoidControversial: false } },
  { name: "Avoid wigs", config: { noSkinToneChange: true, avoidCultureSpecific: false, avoidReligious: false, avoidPolitical: false, avoidFacePaint: false, avoidWigs: true, avoidControversial: false } },
  { name: "Avoid face paint", config: { noSkinToneChange: true, avoidCultureSpecific: false, avoidReligious: false, avoidPolitical: false, avoidFacePaint: true, avoidWigs: false, avoidControversial: false } },
  { name: "Avoid controversial", config: { noSkinToneChange: true, avoidCultureSpecific: false, avoidReligious: false, avoidPolitical: false, avoidFacePaint: false, avoidWigs: false, avoidControversial: true } },
  { name: "All restrictions", config: { noSkinToneChange: true, avoidCultureSpecific: true, avoidReligious: true, avoidPolitical: true, avoidFacePaint: true, avoidWigs: true, avoidControversial: true } },
];

const practicalConfigs = [
  { name: "No constraints", config: { mustBeComfortable: false, mustSurviveCrowdedBar: false, needsPockets: false, indoorOnly: false } },
  { name: "Bar friendly", config: { mustBeComfortable: false, mustSurviveCrowdedBar: true, needsPockets: false, indoorOnly: false } },
  { name: "Needs pockets", config: { mustBeComfortable: false, mustSurviveCrowdedBar: false, needsPockets: true, indoorOnly: false } },
  { name: "Comfortable", config: { mustBeComfortable: true, mustSurviveCrowdedBar: false, needsPockets: false, indoorOnly: false } },
  { name: "All practical", config: { mustBeComfortable: true, mustSurviveCrowdedBar: true, needsPockets: true, indoorOnly: false } },
];

// Build a base quiz response
function buildQuiz(
  universe: QuizResponse["universes"],
  effort: QuizResponse["effort"],
  budget: QuizResponse["budget"],
  boundaries: QuizResponse["boundaries"],
  practical: QuizResponse["practical"]
): QuizResponse {
  return {
    goals: ["stylish"],
    nicheTarget: 5,
    effort,
    budget,
    genderPref: "dont_care",
    resemblanceTarget: 5,
    universes: universe,
    era: "any",
    boundaries,
    practical,
  };
}

// Track results
interface TestResult {
  combo: string;
  preRelax: number;
  postRelax: number;
  relaxations: string[];
  passed: boolean;
}

const results: TestResult[] = [];
let totalTests = 0;
let passed = 0;
let failed = 0;
let needed_relaxation = 0;

// Test critical combinations (not exhaustive - would be too many)
console.log(`Testing critical filter combinations...\n`);

// Test 1: Each universe with each effort level (default boundaries)
console.log(`📁 Testing Universe × Effort combinations...`);
for (const universe of universes) {
  for (const effort of efforts) {
    totalTests++;
    const quiz = buildQuiz(
      universe,
      effort,
      "dont_care",
      boundaryConfigs[0].config,
      practicalConfigs[0].config
    );
    
    const preRelax = applyHardFilters(costumes, quiz).length;
    const { costumes: postRelax, relaxationsApplied } = applyRelaxationLadder(costumes, quiz, 3);
    
    const passed_test = postRelax.length >= 3;
    if (passed_test) passed++;
    else failed++;
    if (relaxationsApplied.length > 0) needed_relaxation++;
    
    const universeStr = universe.length === 5 ? "all" : universe.join("+");
    results.push({
      combo: `${universeStr} / ${effort}`,
      preRelax,
      postRelax: postRelax.length,
      relaxations: relaxationsApplied,
      passed: passed_test,
    });
  }
}

// Test 2: Each universe with strict boundaries
console.log(`🛡️  Testing Universe × Strict Boundaries...`);
for (const universe of universes.slice(0, 5)) { // Single universes only
  totalTests++;
  const quiz = buildQuiz(
    universe,
    "few_fast",
    "dont_care",
    boundaryConfigs[4].config, // All restrictions
    practicalConfigs[0].config
  );
  
  const preRelax = applyHardFilters(costumes, quiz).length;
  const { costumes: postRelax, relaxationsApplied } = applyRelaxationLadder(costumes, quiz, 3);
  
  const passed_test = postRelax.length >= 3;
  if (passed_test) passed++;
  else failed++;
  if (relaxationsApplied.length > 0) needed_relaxation++;
  
  results.push({
    combo: `${universe[0]} / all-restrictions`,
    preRelax,
    postRelax: postRelax.length,
    relaxations: relaxationsApplied,
    passed: passed_test,
  });
}

// Test 3: Low budget with various universes
console.log(`💵 Testing Low Budget scenarios...`);
for (const universe of universes.slice(0, 5)) {
  totalTests++;
  const quiz = buildQuiz(
    universe,
    "one_item",
    "lt_30",
    boundaryConfigs[0].config,
    practicalConfigs[0].config
  );
  
  const preRelax = applyHardFilters(costumes, quiz).length;
  const { costumes: postRelax, relaxationsApplied } = applyRelaxationLadder(costumes, quiz, 3);
  
  const passed_test = postRelax.length >= 3;
  if (passed_test) passed++;
  else failed++;
  if (relaxationsApplied.length > 0) needed_relaxation++;
  
  results.push({
    combo: `${universe[0]} / one_item / <$30`,
    preRelax,
    postRelax: postRelax.length,
    relaxations: relaxationsApplied,
    passed: passed_test,
  });
}

// Test 4: All practical constraints with various universes
console.log(`🎒 Testing All Practical Constraints...`);
for (const universe of universes.slice(0, 5)) {
  totalTests++;
  const quiz = buildQuiz(
    universe,
    "few_fast",
    "dont_care",
    boundaryConfigs[0].config,
    practicalConfigs[4].config // All practical
  );
  
  const preRelax = applyHardFilters(costumes, quiz).length;
  const { costumes: postRelax, relaxationsApplied } = applyRelaxationLadder(costumes, quiz, 3);
  
  const passed_test = postRelax.length >= 3;
  if (passed_test) passed++;
  else failed++;
  if (relaxationsApplied.length > 0) needed_relaxation++;
  
  results.push({
    combo: `${universe[0]} / all-practical`,
    preRelax,
    postRelax: postRelax.length,
    relaxations: relaxationsApplied,
    passed: passed_test,
  });
}

// Test 5: Worst case - strictest everything
console.log(`⚠️  Testing Worst Case scenarios...`);
const worstCases = [
  { universe: ["sports"] as QuizResponse["universes"], effort: "one_item" as const, budget: "lt_30" as const, boundaries: boundaryConfigs[4].config, practical: practicalConfigs[4].config },
  { universe: ["internet"] as QuizResponse["universes"], effort: "one_item" as const, budget: "lt_30" as const, boundaries: boundaryConfigs[4].config, practical: practicalConfigs[0].config },
  { universe: ["music"] as QuizResponse["universes"], effort: "one_item" as const, budget: "lt_30" as const, boundaries: boundaryConfigs[1].config, practical: practicalConfigs[0].config }, // avoid wigs for music
];

for (const wc of worstCases) {
  totalTests++;
  const quiz = buildQuiz(wc.universe, wc.effort, wc.budget, wc.boundaries, wc.practical);
  
  const preRelax = applyHardFilters(costumes, quiz).length;
  const { costumes: postRelax, relaxationsApplied } = applyRelaxationLadder(costumes, quiz, 3);
  
  const passed_test = postRelax.length >= 3;
  if (passed_test) passed++;
  else failed++;
  if (relaxationsApplied.length > 0) needed_relaxation++;
  
  results.push({
    combo: `WORST: ${wc.universe[0]} / ${wc.effort} / ${wc.budget}`,
    preRelax,
    postRelax: postRelax.length,
    relaxations: relaxationsApplied,
    passed: passed_test,
  });
}

// Print summary
console.log(`\n${"=".repeat(70)}`);
console.log(`RESULTS SUMMARY`);
console.log(`${"=".repeat(70)}\n`);

// Print failures first
const failures = results.filter(r => !r.passed);
if (failures.length > 0) {
  console.log(`❌ FAILED COMBINATIONS (${failures.length}):`);
  for (const f of failures) {
    console.log(`   - ${f.combo}: ${f.preRelax} → ${f.postRelax} (need 3)`);
    if (f.relaxations.length > 0) {
      console.log(`     Relaxations tried: ${f.relaxations.join(", ")}`);
    }
  }
  console.log();
}

// Print combinations that needed relaxation
const relaxed = results.filter(r => r.passed && r.relaxations.length > 0);
if (relaxed.length > 0) {
  console.log(`⚠️  PASSED WITH RELAXATION (${relaxed.length}):`);
  for (const r of relaxed) {
    console.log(`   - ${r.combo}: ${r.preRelax} → ${r.postRelax}`);
    console.log(`     Relaxations: ${r.relaxations.join(", ")}`);
  }
  console.log();
}

// Coverage stats by universe
console.log(`📊 COVERAGE BY UNIVERSE:`);
const universeNames = ["movie", "tv", "music", "sports", "internet"];
for (const u of universeNames) {
  const count = costumes.filter(c => c.universe === u).length;
  const pct = ((count / costumes.length) * 100).toFixed(1);
  console.log(`   ${u.padEnd(10)} ${count.toString().padStart(3)} costumes (${pct}%)`);
}

console.log(`\n📊 COVERAGE BY EFFORT LEVEL:`);
const effortLevels = ["one_item", "few_fast", "some_work", "suffer_for_bit"];
for (const e of effortLevels) {
  const count = costumes.filter(c => c.constraints.effort === e).length;
  const pct = ((count / costumes.length) * 100).toFixed(1);
  console.log(`   ${e.padEnd(15)} ${count.toString().padStart(3)} costumes (${pct}%)`);
}

console.log(`\n📊 SPECIAL REQUIREMENTS:`);
const withWig = costumes.filter(c => c.requirements.wigRequired).length;
const withFacePaint = costumes.filter(c => c.requirements.facePaintRequired).length;
const controversial = costumes.filter(c => c.safety.controversial).length;
const political = costumes.filter(c => c.safety.politicalFigure).length;
console.log(`   Requires wig:        ${withWig.toString().padStart(3)} costumes`);
console.log(`   Requires face paint: ${withFacePaint.toString().padStart(3)} costumes`);
console.log(`   Controversial:       ${controversial.toString().padStart(3)} costumes`);
console.log(`   Political figures:   ${political.toString().padStart(3)} costumes`);

console.log(`\n${"=".repeat(70)}`);
console.log(`FINAL SCORE: ${passed}/${totalTests} tests passed`);
console.log(`  - ${passed} passed outright`);
console.log(`  - ${needed_relaxation} needed relaxation to pass`);
console.log(`  - ${failed} failed completely`);
console.log(`${"=".repeat(70)}\n`);

// Exit with error code if any tests failed
if (failed > 0) {
  console.log(`\n💡 Recommendations to fix failures:`);
  console.log(`   1. Add more costumes for underrepresented universes/efforts`);
  console.log(`   2. Ensure each universe has at least 20 costumes`);
  console.log(`   3. Ensure each effort level has at least 30 costumes`);
  console.log(`   4. Add more "safe" costumes (non-controversial, no wigs, etc.)\n`);
  process.exit(1);
} else {
  console.log(`✅ All tests passed! Dataset coverage is sufficient.\n`);
  process.exit(0);
}

