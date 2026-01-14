/**
 * Image Resolver
 *
 * Reference: README.md §5 Image Strategy, §8.3
 * Resolves TMDB/Wikimedia/manual image sources to URLs.
 */

import type { ImageSource } from "./schema";

export type ResolvedImage = {
  url: string;
  attributionText?: string;
  attributionLink?: string;
};

// TMDB configuration cache
let tmdbConfig: {
  baseUrl: string;
  posterSizes: string[];
  fetchedAt: number;
} | null = null;

const TMDB_CONFIG_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch and cache TMDB configuration
 */
async function getTmdbConfig(): Promise<typeof tmdbConfig> {
  const now = Date.now();

  if (tmdbConfig && now - tmdbConfig.fetchedAt < TMDB_CONFIG_TTL) {
    return tmdbConfig;
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.warn("TMDB_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`TMDB config fetch failed: ${response.status}`);
    }

    const data = await response.json();
    tmdbConfig = {
      baseUrl: data.images.secure_base_url,
      posterSizes: data.images.poster_sizes,
      fetchedAt: now,
    };

    return tmdbConfig;
  } catch (error) {
    console.error("Failed to fetch TMDB config:", error);
    return null;
  }
}

/**
 * Resolve TMDB image source to URL
 */
async function resolveTmdb(
  source: Extract<ImageSource, { kind: "tmdb" }>
): Promise<ResolvedImage | null> {
  const config = await getTmdbConfig();
  if (!config) return null;

  // Prefer w500 size for result cards (2:3 aspect)
  const size =
    config.posterSizes.includes("w500") ? "w500" : config.posterSizes[config.posterSizes.length - 2];

  // Use mediaType from source (defaults to "movie")
  const type = source.mediaType || "movie";

  return {
    url: `${config.baseUrl}${size}${source.imagePath}`,
    attributionText: "Image via TMDB",
    attributionLink: `https://www.themoviedb.org/${type}/${source.tmdbId}`,
  };
}

/**
 * Resolve TMDB person (actor) image source to URL
 */
async function resolveTmdbPerson(
  source: Extract<ImageSource, { kind: "tmdb_person" }>
): Promise<ResolvedImage | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.warn("TMDB_API_KEY not configured");
    return null;
  }

  try {
    // Fetch person details to get profile_path
    const response = await fetch(
      `https://api.themoviedb.org/3/person/${source.personId}?api_key=${apiKey}`
    );

    if (!response.ok) {
      console.error(`TMDB person fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.profile_path) {
      console.warn(`No profile image for person ${source.personId}`);
      return null;
    }

    const config = await getTmdbConfig();
    if (!config) return null;

    // Use w500 size for profile photos
    const size = config.posterSizes.includes("w500") ? "w500" : "w342";

    return {
      url: `${config.baseUrl}${size}${data.profile_path}`,
      attributionText: `Photo of ${source.personName} via TMDB`,
      attributionLink: `https://www.themoviedb.org/person/${source.personId}`,
    };
  } catch (error) {
    console.error("Failed to fetch TMDB person:", error);
    return null;
  }
}

/**
 * Resolve Wikimedia Commons image source to URL
 */
function resolveWikimedia(
  source: Extract<ImageSource, { kind: "wikimedia" }>
): ResolvedImage {
  // Wikimedia Commons file URL format
  const encodedTitle = encodeURIComponent(source.fileTitle.replace(/ /g, "_"));
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodedTitle}?width=500`;

  return {
    url,
    attributionText: "Image via Wikimedia Commons",
    attributionLink:
      source.pageUrl ||
      `https://commons.wikimedia.org/wiki/File:${encodedTitle}`,
  };
}

/**
 * Resolve manual image source
 */
function resolveManual(
  source: Extract<ImageSource, { kind: "manual" }>
): ResolvedImage {
  return {
    url: source.url,
    attributionText: source.attribution,
  };
}

/**
 * Resolve any image source to a usable URL
 */
export async function resolveImage(
  source: ImageSource
): Promise<ResolvedImage | null> {
  switch (source.kind) {
    case "tmdb":
      return resolveTmdb(source);
    case "tmdb_person":
      return resolveTmdbPerson(source);
    case "wikimedia":
      return resolveWikimedia(source);
    case "manual":
      return resolveManual(source);
    default:
      return null;
  }
}

/**
 * Resolve image with fallback cascade
 */
export async function resolveImageWithFallback(
  primary: ImageSource,
  alternatives?: ImageSource[]
): Promise<ResolvedImage> {
  // Try primary
  const primaryResult = await resolveImage(primary);
  if (primaryResult) return primaryResult;

  // Try alternatives
  if (alternatives) {
    for (const alt of alternatives) {
      const altResult = await resolveImage(alt);
      if (altResult) return altResult;
    }
  }

  // Return placeholder
  return {
    url: "/placeholder-costume.svg",
    attributionText: "Reference image unavailable",
  };
}

