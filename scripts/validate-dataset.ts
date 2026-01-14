/**
 * Dataset Validation Script
 *
 * Validates costumes.v1.json against the schema:
 * - All entries match CostumeSchema
 * - No duplicate IDs
 * - All image pointers have required fields
 * - Coverage analysis for filtering
 *
 * Usage: npm run validate-dataset
 */

import * as fs from "fs";
import * as path from "path";
import { CostumeSchema, type Costume } from "../lib/schema";

const DATASET_PATH = path.join(__dirname, "../data/costumes.v1.json");

async function validateDataset() {
  console.log("🔍 Validating costume dataset...\n");

  // Check file exists
  if (!fs.existsSync(DATASET_PATH)) {
    console.log("⚠️  Dataset file not found at:", DATASET_PATH);
    console.log("   Create data/costumes.v1.json to proceed.\n");
    process.exit(0); // Not an error during early development
  }

  const rawData = fs.readFileSync(DATASET_PATH, "utf-8");
  let rawCostumes: unknown[];

  try {
    rawCostumes = JSON.parse(rawData);
  } catch {
    console.error("❌ Invalid JSON in dataset file");
    process.exit(1);
  }

  if (!Array.isArray(rawCostumes)) {
    console.error("❌ Dataset must be an array");
    process.exit(1);
  }

  console.log(`📦 Found ${rawCostumes.length} entries\n`);

  // Validate each costume against schema
  const validCostumes: Costume[] = [];
  const errors: string[] = [];
  const ids = new Set<string>();
  const duplicates: string[] = [];

  for (const [index, rawCostume] of rawCostumes.entries()) {
    const id = (rawCostume as { id?: string }).id || `[index ${index}]`;
    
    // Check for duplicate IDs
    if (ids.has(id)) {
      duplicates.push(id);
    }
    ids.add(id);

    // Validate against schema
    const result = CostumeSchema.safeParse(rawCostume);
    if (result.success) {
      validCostumes.push(result.data);
    } else {
      const issues = result.error.issues.map(
        (issue) => `  - ${issue.path.join(".")}: ${issue.message}`
      );
      errors.push(`❌ ${id}:\n${issues.join("\n")}`);
    }
  }

  // Report errors
  if (duplicates.length > 0) {
    console.error("❌ Duplicate IDs found:", duplicates.join(", "));
  }

  if (errors.length > 0) {
    console.error("\n❌ Schema validation errors:\n");
    errors.forEach((e) => console.error(e + "\n"));
  }

  if (duplicates.length > 0 || errors.length > 0) {
    console.error(`\n❌ Validation failed: ${errors.length} invalid entries, ${duplicates.length} duplicates`);
    process.exit(1);
  }

  // Coverage analysis
  console.log("✅ All entries valid!\n");
  console.log("📊 Coverage Analysis:\n");

  const coverage = {
    universes: new Map<string, number>(),
    eras: new Map<string, number>(),
    efforts: new Map<string, number>(),
    budgets: new Map<string, number>(),
    genderPresentations: new Map<string, number>(),
    nicheScores: new Map<number, number>(),
  };

  for (const costume of validCostumes) {
    coverage.universes.set(costume.universe, (coverage.universes.get(costume.universe) || 0) + 1);
    coverage.eras.set(costume.era, (coverage.eras.get(costume.era) || 0) + 1);
    coverage.efforts.set(costume.constraints.effort, (coverage.efforts.get(costume.constraints.effort) || 0) + 1);
    coverage.budgets.set(costume.constraints.budget, (coverage.budgets.get(costume.constraints.budget) || 0) + 1);
    coverage.genderPresentations.set(costume.genderPresentation, (coverage.genderPresentations.get(costume.genderPresentation) || 0) + 1);
    coverage.nicheScores.set(costume.nicheScore, (coverage.nicheScores.get(costume.nicheScore) || 0) + 1);
  }

  console.log("   Universes:");
  for (const [key, count] of coverage.universes) {
    console.log(`     - ${key}: ${count}`);
  }

  console.log("\n   Eras:");
  for (const [key, count] of coverage.eras) {
    console.log(`     - ${key}: ${count}`);
  }

  console.log("\n   Effort levels:");
  for (const [key, count] of coverage.efforts) {
    console.log(`     - ${key}: ${count}`);
  }

  console.log("\n   Budget tiers:");
  for (const [key, count] of coverage.budgets) {
    console.log(`     - ${key}: ${count}`);
  }

  console.log("\n   Gender presentations:");
  for (const [key, count] of coverage.genderPresentations) {
    console.log(`     - ${key}: ${count}`);
  }

  // Check for missing categories
  const missingUniverses = ["movie", "tv", "music", "sports", "internet"].filter(
    (u) => !coverage.universes.has(u)
  );
  const missingEras = ["70s_80s", "90s", "2000s", "current"].filter(
    (e) => !coverage.eras.has(e)
  );

  if (missingUniverses.length > 0 || missingEras.length > 0) {
    console.log("\n⚠️  Coverage gaps:");
    if (missingUniverses.length > 0) {
      console.log(`   Missing universes: ${missingUniverses.join(", ")}`);
    }
    if (missingEras.length > 0) {
      console.log(`   Missing eras: ${missingEras.join(", ")}`);
    }
  }

  console.log("\n✅ Dataset validation complete!");
  console.log(`   - Total valid: ${validCostumes.length}`);
  console.log(`   - Unique IDs: ${ids.size}`);
}

validateDataset().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
