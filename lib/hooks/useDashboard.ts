/**
 * Dashboard React Query Hooks
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";

// Types
interface DashboardStats {
    monthlyTrend: { year: number; month: number; count: number; totalMinutes: number }[];
    trainingDistribution: { egitimKodu: string; count: number }[];
    groupDistribution: { grup: string; count: number }[];
    internalExternalRatio: { type: string; count: number }[];
    thisMonth: { count: number; totalMinutes: number };
    lastMonth: { count: number; totalMinutes: number };
    yearly: { count: number; totalMinutes: number; uniquePersonnel: number; uniqueTrainings: number };
    totals: { personnel: number; trainings: number; trainers: number };
    recentActivity: { date: string; count: number }[];
    personnelStatusDist: { status: string; count: number }[];
}

interface DashboardResponse {
    success: boolean;
    data: DashboardStats;
}

// Fetch functions
async function fetchDashboardStats(): Promise<DashboardResponse> {
    const response = await fetch("/api/dashboard/stats");
    
    if (!response.ok) {
        throw new Error("Dashboard istatistikleri alınamadı");
    }

    return response.json();
}

// Hooks
export function useDashboardStats() {
    return useQuery({
        queryKey: queryKeys.dashboard.stats(),
        queryFn: fetchDashboardStats,
        staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes frequently
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });
}

// Prefetch helper for dashboard
export function usePrefetchDashboard() {
    const queryClient = useQueryClient();

    return {
        prefetch: () => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.dashboard.stats(),
                queryFn: fetchDashboardStats,
            });
        },
    };
}

// Export types
export type { DashboardStats, DashboardResponse };
