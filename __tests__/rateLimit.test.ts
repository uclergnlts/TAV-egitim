/**
 * Rate Limiting Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkRateLimit, getClientIP, RateLimitPresets } from "@/lib/rateLimit";

describe("Rate Limiting", () => {
    beforeEach(() => {
        // Clear any existing rate limit data before each test
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("checkRateLimit", () => {
        it("should allow first request", () => {
            const result = checkRateLimit("test-id", { maxRequests: 5, windowMs: 60000 });
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4);
        });

        it("should allow requests up to limit", () => {
            const config = { maxRequests: 3, windowMs: 60000 };
            
            // First 3 requests should be allowed
            checkRateLimit("test-id-2", config);
            checkRateLimit("test-id-2", config);
            const result = checkRateLimit("test-id-2", config);
            
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(0);
        });

        it("should block requests over limit", () => {
            const config = { maxRequests: 2, windowMs: 60000 };
            
            checkRateLimit("test-id-3", config);
            checkRateLimit("test-id-3", config);
            const result = checkRateLimit("test-id-3", config);
            
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it("should reset after window expires", () => {
            const config = { maxRequests: 2, windowMs: 60000 };
            
            checkRateLimit("test-id-4", config);
            checkRateLimit("test-id-4", config);
            
            // Advance time by 61 seconds (past the window)
            vi.advanceTimersByTime(61000);
            
            const result = checkRateLimit("test-id-4", config);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(1);
        });

        it("should track different identifiers separately", () => {
            const config = { maxRequests: 2, windowMs: 60000 };
            
            checkRateLimit("id-1", config);
            checkRateLimit("id-1", config);
            
            const resultForId2 = checkRateLimit("id-2", config);
            expect(resultForId2.allowed).toBe(true);
            expect(resultForId2.remaining).toBe(1);
        });
    });

    describe("getClientIP", () => {
        it("should extract IP from x-forwarded-for header", () => {
            const request = new Request("http://localhost", {
                headers: {
                    "x-forwarded-for": "192.168.1.1, 10.0.0.1",
                },
            });
            
            expect(getClientIP(request)).toBe("192.168.1.1");
        });

        it("should extract IP from x-real-ip header", () => {
            const request = new Request("http://localhost", {
                headers: {
                    "x-real-ip": "192.168.1.2",
                },
            });
            
            expect(getClientIP(request)).toBe("192.168.1.2");
        });

        it("should return 'unknown' when no IP headers present", () => {
            const request = new Request("http://localhost");
            
            expect(getClientIP(request)).toBe("unknown");
        });

        it("should prefer x-forwarded-for over x-real-ip", () => {
            const request = new Request("http://localhost", {
                headers: {
                    "x-forwarded-for": "192.168.1.1",
                    "x-real-ip": "192.168.1.2",
                },
            });
            
            expect(getClientIP(request)).toBe("192.168.1.1");
        });
    });

    describe("RateLimitPresets", () => {
        it("should have strict preset with 10 requests per minute", () => {
            expect(RateLimitPresets.strict.maxRequests).toBe(10);
            expect(RateLimitPresets.strict.windowMs).toBe(60000);
        });

        it("should have standard preset with 100 requests per minute", () => {
            expect(RateLimitPresets.standard.maxRequests).toBe(100);
            expect(RateLimitPresets.standard.windowMs).toBe(60000);
        });

        it("should have generous preset with 1000 requests per minute", () => {
            expect(RateLimitPresets.generous.maxRequests).toBe(1000);
            expect(RateLimitPresets.generous.windowMs).toBe(60000);
        });

        it("should have export preset with 30 requests per minute", () => {
            expect(RateLimitPresets.export.maxRequests).toBe(30);
            expect(RateLimitPresets.export.windowMs).toBe(60000);
        });
    });

    describe("Rate limit response headers", () => {
        it("should include correct limit in response", () => {
            const config = { maxRequests: 5, windowMs: 60000 };
            const result = checkRateLimit("test-headers", config);
            
            expect(result.limit).toBe(5);
            expect(result.resetTime).toBeGreaterThan(Date.now());
        });
    });
});
