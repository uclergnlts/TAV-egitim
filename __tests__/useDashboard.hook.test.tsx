import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
};

describe("useDashboard hooks", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("fetches dashboard stats successfully", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
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
            }),
        }) as unknown as typeof fetch;

        const { useDashboardStats } = await import("@/lib/hooks/useDashboard");
        const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(fetch).toHaveBeenCalledWith("/api/dashboard/stats");
    });

    it("handles dashboard fetch error", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ message: "err" }),
        }) as unknown as typeof fetch;

        const { useDashboardStats } = await import("@/lib/hooks/useDashboard");
        const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it("prefetches dashboard stats", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: {} }),
        }) as unknown as typeof fetch;

        const { usePrefetchDashboard } = await import("@/lib/hooks/useDashboard");
        const { result } = renderHook(() => usePrefetchDashboard(), { wrapper: createWrapper() });

        result.current.prefetch();
        await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/dashboard/stats"));
    });
});

