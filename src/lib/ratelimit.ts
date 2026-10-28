import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// In-memory sliding-window fallback when Upstash Redis credentials are not configured
class InMemorySlidingWindowLimiter {
  private windows: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async limit(identifier: string) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = (this.windows.get(identifier) || []).filter(
      (ts) => ts > windowStart
    );

    if (timestamps.length >= this.maxRequests) {
      const oldest = timestamps[0];
      const reset = oldest + this.windowMs;
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset,
      };
    }

    timestamps.push(now);
    this.windows.set(identifier, timestamps);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - timestamps.length,
      reset: now + this.windowMs,
    };
  }
}

let redisLimiter: Ratelimit | null = null;
const memoryLimiter = new InMemorySlidingWindowLimiter(10, 60 * 60 * 1000); // 10 per hour

if (UPSTASH_URL && UPSTASH_TOKEN) {
  const redis = new Redis({
    url: UPSTASH_URL,
    token: UPSTASH_TOKEN,
  });

  redisLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
    prefix: "@linkpulse/ratelimit",
  });
} else {
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[RateLimit WARNING] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing in production. Using memory limiter fallback."
    );
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for link creation: 10 per hour per authenticated user.
 * Identifier: link_create:{userId}
 */
export async function checkLinkCreateRateLimit(
  userId: string
): Promise<RateLimitResult> {
  const identifier = `link_create:${userId}`;

  if (redisLimiter) {
    const res = await redisLimiter.limit(identifier);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  }

  // Fallback to in-memory sliding window
  return memoryLimiter.limit(identifier);
}
