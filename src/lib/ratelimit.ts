import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// In-memory sliding-window limiter for development / testing
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
  try {
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
  } catch (err) {
    console.error("[RateLimit] Failed to initialize Upstash Redis client:", err);
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for link creation: 10 links per hour per authenticated user.
 * Identifier: link_create:{userId}
 */
export async function checkLinkCreateRateLimit(
  userId: string
): Promise<RateLimitResult> {
  const identifier = `link_create:${userId}`;

  // 1. Use Upstash Redis distributed sliding window when configured
  if (redisLimiter) {
    try {
      const res = await redisLimiter.limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    } catch (err) {
      // In production, Redis failures must fail-closed to prevent unlimited link creation
      console.error(
        "[RateLimit] Upstash Redis request failed:",
        err
      );
      if (process.env.NODE_ENV === "production") {
        return {
          success: false,
          limit: 10,
          remaining: 0,
          reset: Date.now() + 60 * 1000,
        };
      }
      // Safe fallback on Redis failure in development / preview
      return memoryLimiter.limit(identifier);
    }
  }

  // 2. Production safety check: do not silently bypass distributed limits in production
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[RateLimit ERROR] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not configured in production environment."
    );
    // Fail safely with server-side rate limit constraint
    return {
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60 * 1000,
    };
  }

  // 3. Local development and test fallback
  return memoryLimiter.limit(identifier);
}
