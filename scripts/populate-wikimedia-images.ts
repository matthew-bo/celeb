/**
 * Script to populate Wikimedia Commons images for costumes without actor photos
 * 
 * This script:
 * 1. Finds costumes that don't have tmdb_person images
 * 2. Searches Wikimedia Commons for relevant images
 * 3. Adds the Wikimedia image as primary (or alternative) source
 * 
 * Usage: npm run populate-wikimedia
 */

import * as fs from "fs";
import * as path from "path";

const DATA_FILE = path.join(__dirname, "../data/costumes.v1.json");

interface Costume {
  id: string;
  name: string;
  displayTitle: string;
  universe: string;
  sourceTitle?: string;
  images: {
    primary: {
      kind: string;
      [key: string]: unknown;
    };
    alternatives?: Array<{
      kind: string;
      [key: string]: unknown;
    }>;
  };
  [key: string]: unknown;
}

interface WikimediaSearchResult {
  title: string;
  pageid: number;
  url?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search Wikimedia Commons for images of a person/character
 */
async function searchWikimediaCommons(
  searchTerm: string
): Promise<WikimediaSearchResult | null> {
  // Clean up search term
  const cleanTerm = searchTerm
    .replace(/\(.*?\)/g, "") // Remove parentheticals
    .replace(/['"]/g, "")
    .trim();

  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    cleanTerm + " portrait"
  )}&srnamespace=6&srlimit=5&format=json&origin=*`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`Wikimedia search failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const results = data.query?.search || [];

    // Filter for good image files (prefer .jpg, .png)
    for (const result of results) {
      const title = result.title as string;
      if (
        title.match(/\.(jpg|jpeg|png)$/i) &&
        !title.toLowerCase().includes("logo") &&
        !title.toLowerCase().includes("signature") &&
        !title.toLowerCase().includes("autograph")
      ) {
        return {
          title: title.replace("File:", ""),
          pageid: result.pageid,
        };
      }
    }

    // If no good match, try without "portrait"
    const fallbackUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      cleanTerm
    )}&srnamespace=6&srlimit=5&format=json&origin=*`;

    const fallbackResponse = await fetch(fallbackUrl);
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      const fallbackResults = fallbackData.query?.search || [];

      for (const result of fallbackResults) {
        const title = result.title as string;
        if (
          title.match(/\.(jpg|jpeg|png)$/i) &&
          !title.toLowerCase().includes("logo") &&
          !title.toLowerCase().includes("signature")
        ) {
          return {
            title: title.replace("File:", ""),
            pageid: result.pageid,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Wikimedia search error for "${searchTerm}":`, error);
    return null;
  }
}

/**
 * Check if a costume needs a Wikimedia image
 */
function needsWikimediaImage(costume: Costume): boolean {
  // Already has a person image as primary
  if (costume.images.primary.kind === "tmdb_person") {
    return false;
  }

  // Already has wikimedia as primary
  if (costume.images.primary.kind === "wikimedia") {
    return false;
  }

  // Check if alternatives have wikimedia
  if (costume.images.alternatives?.some((alt) => alt.kind === "wikimedia")) {
    return false;
  }

  // Skip certain types that won't have good Wikimedia images
  const skipPatterns = [
    /skeleton/i,
    /zombie/i,
    /vampire/i,
    /ghost/i,
    /generic/i,
    /npc/i,
    /dog$/i,
    /bunny$/i,
    /tiger$/i,
    /gecko/i,
    /bear$/i,
    /man$/i, // Michelin Man, etc.
    /owl/i,
    /m&m/i,
    /mascot/i,
  ];

  for (const pattern of skipPatterns) {
    if (pattern.test(costume.name) || pattern.test(costume.displayTitle)) {
      return false;
    }
  }

  return true;
}

/**
 * Get the best search term for a costume
 */
function getSearchTerm(costume: Costume): string {
  // For real people, use their name directly
  const realPeoplePatterns = [
    "music",
    "sports",
    "internet",
  ];

  if (realPeoplePatterns.includes(costume.universe)) {
    return costume.name;
  }

  // For fictional characters, include source
  if (costume.sourceTitle) {
    return `${costume.name} ${costume.sourceTitle}`;
  }

  return costume.displayTitle || costume.name;
}

async function processDataset(): Promise<void> {
  console.log("Loading costume dataset...");
  const rawData = fs.readFileSync(DATA_FILE, "utf-8");
  const costumes: Costume[] = JSON.parse(rawData);

  console.log(`Found ${costumes.length} costumes`);

  // Find costumes that need Wikimedia images
  const needsImages = costumes.filter(needsWikimediaImage);
  console.log(`${needsImages.length} costumes need Wikimedia images\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < needsImages.length; i++) {
    const costume = needsImages[i];
    const searchTerm = getSearchTerm(costume);

    // Rate limiting - be nice to Wikimedia
    await sleep(500);

    console.log(`[${i + 1}/${needsImages.length}] ${costume.name}: Searching for "${searchTerm}"...`);

    const result = await searchWikimediaCommons(searchTerm);

    if (!result) {
      console.log(`  ✗ No suitable image found`);
      failed++;
      continue;
    }

    console.log(`  ✓ Found: ${result.title}`);

    // Find this costume in the main array and update it
    const costumeIndex = costumes.findIndex((c) => c.id === costume.id);
    if (costumeIndex === -1) {
      console.log(`  ✗ Could not find costume in array`);
      failed++;
      continue;
    }

    // Store old primary as alternative if it's a TMDB poster
    const oldPrimary = costumes[costumeIndex].images.primary;
    
    // Set Wikimedia as primary
    costumes[costumeIndex].images.primary = {
      kind: "wikimedia",
      fileTitle: result.title,
      pageUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(result.title.replace(/ /g, "_"))}`,
    };

    // Keep old primary as alternative if useful
    if (oldPrimary.kind === "tmdb" && oldPrimary.imagePath) {
      if (!costumes[costumeIndex].images.alternatives) {
        costumes[costumeIndex].images.alternatives = [];
      }
      costumes[costumeIndex].images.alternatives.unshift(oldPrimary);
    }

    updated++;
  }

  // Write updated dataset
  console.log("\nWriting updated dataset...");
  fs.writeFileSync(DATA_FILE, JSON.stringify(costumes, null, 2));

  console.log("\n=== Summary ===");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed:  ${failed}`);
  console.log(`Total checked: ${needsImages.length}`);
}

// Run the script
processDataset().catch(console.error);

