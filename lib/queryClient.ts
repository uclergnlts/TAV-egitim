/**
 * React Query Client Configuration
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Default query client configuration
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data freshness configuration
            staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time (formerly cacheTime)
            
            // Retry configuration
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Refetch configuration
            refetchOnWindowFocus: false, // Don't refetch when window regains focus
            refetchOnReconnect: true, // Refetch when internet connection is restored
            refetchOnMount: true, // Refetch when component mounts if data is stale
            
            // Error handling
            throwOnError: false,
            
            // Network mode
            networkMode: "online",
        },
        mutations: {
            // Retry configuration for mutations
            retry: 1,
            
            // Network mode
            networkMode: "online",
        },
    },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
    // Personnel queries
    personnel: {
        all: ["personnel"] as const,
        lists: () => [...queryKeys.personnel.all, "list"] as const,
        list: (filters: Record<string, unknown>) => [...queryKeys.personnel.lists(), filters] as const,
        details: () => [...queryKeys.personnel.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.personnel.details(), id] as const,
    },
    
    // Training queries
    trainings: {
        all: ["trainings"] as const,
        lists: () => [...queryKeys.trainings.all, "list"] as const,
        list: (filters?: Record<string, unknown>) => [...queryKeys.trainings.lists(), filters] as const,
        details: () => [...queryKeys.trainings.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.trainings.details(), id] as const,
        topics: (trainingId: string) => [...queryKeys.trainings.all, "topics", trainingId] as const,
    },
    
    // Trainer queries
    trainers: {
        all: ["trainers"] as const,
        lists: () => [...queryKeys.trainers.all, "list"] as const,
        list: () => [...queryKeys.trainers.lists()] as const,
    },
    
    // Attendance queries
    attendances: {
        all: ["attendances"] as const,
        lists: () => [...queryKeys.attendances.all, "list"] as const,
        list: (filters: Record<string, unknown>) => [...queryKeys.attendances.lists(), filters] as const,
        my: () => [...queryKeys.attendances.all, "my"] as const,
    },
    
    // Report queries
    reports: {
        all: ["reports"] as const,
        monthly: (year: number, month: number) => [...queryKeys.reports.all, "monthly", year, month] as const,
        yearly: (year: number) => [...queryKeys.reports.all, "yearly", year] as const,
        detail: (filters: Record<string, unknown>) => [...queryKeys.reports.all, "detail", filters] as const,
        statistics: () => [...queryKeys.reports.all, "statistics"] as const,
    },
    
    // Dashboard queries
    dashboard: {
        all: ["dashboard"] as const,
        stats: () => [...queryKeys.dashboard.all, "stats"] as const,
    },
    
    // Definition queries
    definitions: {
        all: ["definitions"] as const,
        groups: () => [...queryKeys.definitions.all, "groups"] as const,
        locations: () => [...queryKeys.definitions.all, "locations"] as const,
        documents: () => [...queryKeys.definitions.all, "documents"] as const,
    },
    
    // User queries
    users: {
        all: ["users"] as const,
        lists: () => [...queryKeys.users.all, "list"] as const,
        list: () => [...queryKeys.users.lists()] as const,
        me: () => [...queryKeys.users.all, "me"] as const,
    },
    
    // Audit logs
    auditLogs: {
        all: ["auditLogs"] as const,
        lists: () => [...queryKeys.auditLogs.all, "list"] as const,
        list: (page: number) => [...queryKeys.auditLogs.lists(), page] as const,
    },
};

/**
 * Prefetch helper for common data
 */
export async function prefetchCommonData() {
    // Prefetch frequently accessed data
    const prefetchPromises = [
        queryClient.prefetchQuery({
            queryKey: queryKeys.definitions.groups(),
            queryFn: async () => {
                const res = await fetch("/api/definitions/groups");
                return res.json();
            },
        }),
        queryClient.prefetchQuery({
            queryKey: queryKeys.definitions.locations(),
            queryFn: async () => {
                const res = await fetch("/api/definitions/locations");
                return res.json();
            },
        }),
    ];
    
    await Promise.all(prefetchPromises);
}

/**
 * Invalidate related caches after mutations
 */
export function invalidatePersonnelCache() {
    queryClient.invalidateQueries({ queryKey: queryKeys.personnel.all });
}

export function invalidateTrainingCache() {
    queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
}

export function invalidateAttendanceCache() {
    queryClient.invalidateQueries({ queryKey: queryKeys.attendances.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
}

export function invalidateReportCache() {
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}
