"use client";

import { ReactNode } from "react";
import { QueryClientProvider as TanStackQueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";

interface QueryClientProviderProps {
    children: ReactNode;
}

/**
 * React Query Client Provider
 * Wraps the application with QueryClient context
 * Includes ReactQueryDevtools in development
 */
export function QueryClientProvider({ children }: QueryClientProviderProps) {
    return (
        <TanStackQueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === "development" && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom" />
            )}
        </TanStackQueryClientProvider>
    );
}

export default QueryClientProvider;
