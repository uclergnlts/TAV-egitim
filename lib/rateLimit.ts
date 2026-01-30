/**
 * Rate Limiting Utility
 * In-memory rate limiting for API endpoints
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

// Default config: 100 requests per minute
const DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
};

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 1000); // Clean up every minute

/**
 * Check if request is rate limited
 * @param identifier - Unique identifier (IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    limit: number;
} {
    const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };
    const now = Date.now();
    const key = identifier;

    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
        // New window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetTime: now + windowMs,
            limit: maxRequests,
        };
    }

    if (entry.count >= maxRequests) {
        // Rate limit exceeded
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
            limit: maxRequests,
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetTime: entry.resetTime,
        limit: maxRequests,
    };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
        return realIP;
    }
    
    return 'unknown';
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
    // Strict: 10 requests per minute (for login, sensitive operations)
    strict: {
        maxRequests: 10,
        windowMs: 60 * 1000,
    },
    // Standard: 100 requests per minute (for general API)
    standard: {
        maxRequests: 100,
        windowMs: 60 * 1000,
    },
    // Generous: 1000 requests per minute (for bulk operations)
    generous: {
        maxRequests: 1000,
        windowMs: 60 * 1000,
    },
    // Export: 30 requests per minute (for report exports)
    export: {
        maxRequests: 30,
        windowMs: 60 * 1000,
    },
} as const;
