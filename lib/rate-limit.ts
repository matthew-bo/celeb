/**
 * Rate Limiting
 *
 * Reference: README.md §12
 * Uses Upstash Redis for distributed rate limiting.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy initialization to handle missing env vars gracefully
let rateLimiters: {
  recommend: Ratelimit;
  "more-like-this": Ratelimit;
} | null = null;

// Burst limiter for short-term spike protection
let burstLimiter: Ratelimit | null = null;

function getRateLimiters() {
  if (rateLimiters) return rateLimiters;

  // Check if Redis is configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("Upstash Redis not configured, rate limiting disabled");
    return null;
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  rateLimiters = {
    // /api/recommend: 30 req / 10 min / IP
    recommend: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "10 m"),
      prefix: "rl:recommend",
    }),
    // /api/more-like-this: 60 req / 10 min / IP
    "more-like-this": new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "10 m"),
      prefix: "rl:more-like-this",
    }),
  };

  // Burst control: 5 req / 10 sec per README.md §12
  burstLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 s"),
    prefix: "rl:burst",
  });

  return rateLimiters;
}

export type RateLimitResult = {
  success: boolean;
  remaining?: number;
  reset?: number;
};

/**
 * Check rate limit for an endpoint
 * Checks both endpoint-specific limit and burst limit
 */
export async function checkRateLimit(
  ip: string,
  endpoint: "recommend" | "more-like-this"
): Promise<RateLimitResult> {
  const limiters = getRateLimiters();

  // If rate limiting is not configured, allow all requests
  if (!limiters) {
    return { success: true };
  }

  // Check burst limit first (5 req / 10 sec)
  if (burstLimiter) {
    const burstResult = await burstLimiter.limit(ip);
    if (!burstResult.success) {
      return {
        success: false,
        remaining: burstResult.remaining,
        reset: burstResult.reset,
      };
    }
  }

  // Check endpoint-specific limit
  const limiter = limiters[endpoint];
  const result = await limiter.limit(ip);

  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

