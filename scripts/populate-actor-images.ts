/**
 * Script to populate TMDB actor/person images for each costume
 * 
 * This script:
 * 1. Reads the costume dataset
 * 2. For each costume with a TMDB movie/TV ID, fetches the cast
 * 3. Matches the character name to find the actor
 * 4. Adds the actor's person ID as an alternative image source
 * 
 * Usage: npx ts-node scripts/populate-actor-images.ts
 */

import * as fs from "fs";
import * as path from "path";

// Load environment variables
import "dotenv/config";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const DATA_FILE = path.join(__dirname, "../data/costumes.v1.json");
const OUTPUT_FILE = path.join(__dirname, "../data/costumes.v1.json");

interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface Costume {
  id: string;
  name: string;
  displayTitle: string;
  universe: string;
  sourceTitle?: string;
  images: {
    primary: {
      kind: string;
      tmdbId?: number;
      mediaType?: string;
      imagePath?: string;
      imageType?: string;
      personId?: number;
      personName?: string;
    };
    alternatives?: Array<{
      kind: string;
      personId?: number;
      personName?: string;
      tmdbId?: number;
      imagePath?: string;
      imageType?: string;
      mediaType?: string;
    }>;
  };
  [key: string]: unknown;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCast(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<TmdbCastMember[]> {
  const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch cast for ${mediaType}/${tmdbId}: ${response.status}`);
    return [];
  }
  
  const data = await response.json();
  return data.cast || [];
}

function normalizeCharacterName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findBestActorMatch(
  characterName: string,
  cast: TmdbCastMember[]
): TmdbCastMember | null {
  const normalizedTarget = normalizeCharacterName(characterName);
  
  // Try exact match first
  for (const member of cast) {
    const normalizedCharacter = normalizeCharacterName(member.character);
    if (normalizedCharacter === normalizedTarget) {
      return member;
    }
  }
  
  // Try partial match (character name contains our target or vice versa)
  for (const member of cast) {
    const normalizedCharacter = normalizeCharacterName(member.character);
    if (
      normalizedCharacter.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedCharacter)
    ) {
      return member;
    }
  }
  
  // Try matching first name only
  const targetFirstName = normalizedTarget.split(" ")[0];
  for (const member of cast) {
    const characterFirstName = normalizeCharacterName(member.character).split(" ")[0];
    if (characterFirstName === targetFirstName && targetFirstName.length > 2) {
      return member;
    }
  }
  
  // For main characters, often the top-billed actor is correct
  // Only use this for very recognizable single-name characters
  if (cast.length > 0 && normalizedTarget.split(" ").length === 1) {
    // Check if the first few cast members have matching single names
    for (let i = 0; i < Math.min(5, cast.length); i++) {
      const memberFirstName = normalizeCharacterName(cast[i].character).split(" ")[0];
      if (memberFirstName === targetFirstName) {
        return cast[i];
      }
    }
  }
  
  return null;
}

async function processDataset(): Promise<void> {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY not set in environment");
    process.exit(1);
  }

  console.log("Loading costume dataset...");
  const rawData = fs.readFileSync(DATA_FILE, "utf-8");
  const costumes: Costume[] = JSON.parse(rawData);
  
  console.log(`Found ${costumes.length} costumes to process`);
  
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  
  for (let i = 0; i < costumes.length; i++) {
    const costume = costumes[i];
    
    // Skip if already has a person image
    if (costume.images.primary.kind === "tmdb_person") {
      console.log(`[${i + 1}/${costumes.length}] ${costume.name}: Already has person image`);
      skipped++;
      continue;
    }
    
    // Check if alternatives already has a person image
    const hasPersonAlt = costume.images.alternatives?.some(
      (alt) => alt.kind === "tmdb_person"
    );
    if (hasPersonAlt) {
      console.log(`[${i + 1}/${costumes.length}] ${costume.name}: Already has person in alternatives`);
      skipped++;
      continue;
    }
    
    // Need TMDB ID to fetch cast
    if (costume.images.primary.kind !== "tmdb" || !costume.images.primary.tmdbId) {
      console.log(`[${i + 1}/${costumes.length}] ${costume.name}: No TMDB ID, skipping`);
      skipped++;
      continue;
    }
    
    const tmdbId = costume.images.primary.tmdbId;
    const mediaType = (costume.images.primary.mediaType as "movie" | "tv") || "movie";
    
    // Rate limiting - TMDB allows ~40 requests per 10 seconds
    await sleep(250);
    
    try {
      const cast = await fetchCast(tmdbId, mediaType);
      
      if (cast.length === 0) {
        console.log(`[${i + 1}/${costumes.length}] ${costume.name}: No cast found`);
        failed++;
        continue;
      }
      
      const actor = findBestActorMatch(costume.name, cast);
      
      if (!actor) {
        console.log(`[${i + 1}/${costumes.length}] ${costume.name}: No matching actor found in cast`);
        // Log first few cast members for debugging
        console.log(`  Cast: ${cast.slice(0, 5).map((c) => `${c.name} as ${c.character}`).join(", ")}`);
        failed++;
        continue;
      }
      
      if (!actor.profile_path) {
        console.log(`[${i + 1}/${costumes.length}] ${costume.name}: Actor ${actor.name} has no profile photo`);
        failed++;
        continue;
      }
      
      // Add person image as the PRIMARY image (move old primary to alternatives)
      const oldPrimary = { ...costume.images.primary };
      
      costume.images.primary = {
        kind: "tmdb_person",
        personId: actor.id,
        personName: actor.name,
      };
      
      // Keep old poster as alternative
      if (!costume.images.alternatives) {
        costume.images.alternatives = [];
      }
      costume.images.alternatives.unshift(oldPrimary);
      
      console.log(`[${i + 1}/${costumes.length}] ${costume.name}: ✓ Found ${actor.name} (ID: ${actor.id})`);
      updated++;
      
    } catch (error) {
      console.error(`[${i + 1}/${costumes.length}] ${costume.name}: Error - ${error}`);
      failed++;
    }
  }
  
  // Write updated dataset
  console.log("\nWriting updated dataset...");
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(costumes, null, 2));
  
  console.log("\n=== Summary ===");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed:  ${failed}`);
  console.log(`Total:   ${costumes.length}`);
}

// Run the script
processDataset().catch(console.error);

