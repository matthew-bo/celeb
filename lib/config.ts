/**
 * Configuration Module
 *
 * Type-safe environment variable access.
 * Validates required config at startup.
 */

export type Config = {
  openai: {
    apiKey: string;
  };
  tmdb: {
    apiKey: string | undefined;
  };
  upstash: {
    url: string | undefined;
    token: string | undefined;
  };
  isDevelopment: boolean;
  isProduction: boolean;
};

/**
 * Get configuration with validation.
 * Throws in production if required vars are missing.
 */
export function getConfig(): Config {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  const config: Config = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
    },
    tmdb: {
      apiKey: process.env.TMDB_API_KEY,
    },
    upstash: {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
    isDevelopment,
    isProduction,
  };

  // Validate required config in production
  if (isProduction) {
    const missing: string[] = [];

    if (!config.openai.apiKey) {
      missing.push("OPENAI_API_KEY");
    }
    if (!config.tmdb.apiKey) {
      missing.push("TMDB_API_KEY");
    }
    if (!config.upstash.url || !config.upstash.token) {
      missing.push("UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN");
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
  }

  return config;
}

/**
 * Check if a feature is available based on config
 */
export function isFeatureAvailable(feature: "llm" | "images" | "rateLimit"): boolean {
  const config = getConfig();

  switch (feature) {
    case "llm":
      return Boolean(config.openai.apiKey);
    case "images":
      return Boolean(config.tmdb.apiKey);
    case "rateLimit":
      return Boolean(config.upstash.url && config.upstash.token);
    default:
      return false;
  }
}

