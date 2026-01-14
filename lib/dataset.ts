/**
 * Dataset Loader
 *
 * Reference: README.md §13 - Dataset loading
 * Loads and caches costume dataset in module scope.
 *
 * NOTE: This module uses Node.js fs module and is NOT compatible with Edge Runtime.
 * API routes using this must run in Node.js runtime (the default).
 * If Edge Runtime is needed, switch to fetching from a CDN or use Vercel KV.
 */

import { CostumeSchema, type Costume } from "./schema";
import * as fs from "fs";
import * as path from "path";

// Module-level cache
let cachedDataset: {
  costumes: Costume[];
  version: string;
} | null = null;

const DATASET_PATH = path.join(process.cwd(), "data", "costumes.v1.json");
const DATASET_VERSION = "v1";

/**
 * Load and validate costume dataset.
 * Cached in module scope per README.md §13.
 */
export function loadDataset(): { costumes: Costume[]; version: string } {
  if (cachedDataset) {
    return cachedDataset;
  }

  if (!fs.existsSync(DATASET_PATH)) {
    console.warn("Dataset file not found, returning empty dataset");
    cachedDataset = { costumes: [], version: DATASET_VERSION };
    return cachedDataset;
  }

  const rawData = fs.readFileSync(DATASET_PATH, "utf-8");
  const parsed = JSON.parse(rawData);

  if (!Array.isArray(parsed)) {
    throw new Error("Dataset must be an array");
  }

  // Validate each costume
  const costumes: Costume[] = [];
  for (const item of parsed) {
    const result = CostumeSchema.safeParse(item);
    if (result.success) {
      costumes.push(result.data);
    } else {
      console.warn(`Invalid costume entry: ${item?.id || "unknown"}`, result.error.message);
    }
  }

  cachedDataset = { costumes, version: DATASET_VERSION };
  return cachedDataset;
}

/**
 * Clear cached dataset (for testing)
 */
export function clearDatasetCache(): void {
  cachedDataset = null;
}

