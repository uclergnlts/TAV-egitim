/**
 * React Query Hooks Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
};

describe("React Query Setup", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should provide QueryClient context", () => {
        const wrapper = createWrapper();
        
        // Simple test to verify wrapper renders
        const { result } = renderHook(() => ({ success: true }), { wrapper });
        expect(result.current.success).toBe(true);
    });
});

describe("Query Keys", () => {
    it("should generate consistent query keys", async () => {
        const { queryKeys } = await import("@/lib/queryClient");

        // Personnel keys
        expect(queryKeys.personnel.all).toEqual(["personnel"]);
        expect(queryKeys.personnel.lists()).toEqual(["personnel", "list"]);
        expect(queryKeys.personnel.list({ page: 1 })).toEqual([
            "personnel",
            "list",
            { page: 1 },
        ]);

        // Training keys
        expect(queryKeys.trainings.all).toEqual(["trainings"]);
        expect(queryKeys.trainings.list()).toEqual(["trainings", "list"]);

        // Dashboard keys
        expect(queryKeys.dashboard.all).toEqual(["dashboard"]);
        expect(queryKeys.dashboard.stats()).toEqual(["dashboard", "stats"]);
    });
});

describe("Query Client Configuration", () => {
    it("should have correct default options", async () => {
        const { queryClient } = await import("@/lib/queryClient");

        const defaultOptions = queryClient.getDefaultOptions();

        expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
        expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000); // 10 minutes
        expect(defaultOptions.queries?.retry).toBe(2);
        expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    });
});

// Mock fetch for hooks tests
global.fetch = vi.fn();

describe("usePersonnel Hook", () => {
    it("should fetch personnel list", async () => {
        const mockData = {
            success: true,
            data: [
                { id: "1", fullName: "John Doe", sicilNo: "PER001" },
            ],
            pagination: {
                total: 1,
                page: 1,
                totalPages: 1,
                limit: 50,
            },
        };

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockData,
        });

        const { usePersonnelList } = await import("@/lib/hooks/usePersonnel");
        const wrapper = createWrapper();

        const { result } = renderHook(() => usePersonnelList({ page: 1 }), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockData);
    });

    it("should handle error", async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        const { usePersonnelList } = await import("@/lib/hooks/usePersonnel");
        const wrapper = createWrapper();

        const { result } = renderHook(() => usePersonnelList({ page: 1 }), { wrapper });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeDefined();
    });
});

describe("useTrainings Hook", () => {
    it("should fetch trainings list", async () => {
        const mockData = {
            success: true,
            data: [
                { id: "1", code: "TRN001", name: "Safety Training", has_topics: false, topics: [] },
            ],
        };

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockData,
        });

        const { useTrainings } = await import("@/lib/hooks/useTrainings");
        const wrapper = createWrapper();

        const { result } = renderHook(() => useTrainings(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockData);
    });
});

describe("useDashboard Hook", () => {
    it("should fetch dashboard stats", async () => {
        const mockData = {
            success: true,
            data: {
                monthlyTrend: [],
                trainingDistribution: [],
                groupDistribution: [],
                internalExternalRatio: [],
                thisMonth: { count: 0, totalMinutes: 0 },
                lastMonth: { count: 0, totalMinutes: 0 },
                yearly: { count: 0, totalMinutes: 0, uniquePersonnel: 0, uniqueTrainings: 0 },
                totals: { personnel: 0, trainings: 0, trainers: 0 },
                recentActivity: [],
                personnelStatusDist: [],
            },
        };

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockData,
        });

        const { useDashboardStats } = await import("@/lib/hooks/useDashboard");
        const wrapper = createWrapper();

        const { result } = renderHook(() => useDashboardStats(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockData);
    });
});
