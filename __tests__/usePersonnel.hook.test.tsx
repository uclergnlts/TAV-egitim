import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

const invalidatePersonnelCacheMock = vi.fn();

vi.mock("@/lib/queryClient", async () => {
    const actual = await vi.importActual<typeof import("@/lib/queryClient")>("@/lib/queryClient");
    return {
        ...actual,
        invalidatePersonnelCache: invalidatePersonnelCacheMock,
    };
});

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
};

describe("usePersonnel hooks", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("fetches personnel list with filters", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: [{ id: "p1", sicilNo: "1001", fullName: "Person 1" }],
                pagination: { total: 1, page: 1, totalPages: 1, limit: 10 },
            }),
        }) as unknown as typeof fetch;

        const { usePersonnelList } = await import("@/lib/hooks/usePersonnel");
        const { result } = renderHook(
            () =>
                usePersonnelList({
                    page: 1,
                    limit: 10,
                    query: "Ali",
                    sortBy: "fullName",
                    sortOrder: "asc",
                    advancedFilters: [{ key: "grup", operator: "eq", value: "A" }] as never,
                }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(fetch).toHaveBeenCalledTimes(1);
        const calledUrl = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(calledUrl).toContain("/api/personnel?");
        expect(calledUrl).toContain("page=1");
        expect(calledUrl).toContain("limit=10");
        expect(calledUrl).toContain("query=Ali");
        expect(calledUrl).toContain("sortBy=fullName");
    });

    it("does not fetch personnel detail when id is empty", async () => {
        global.fetch = vi.fn() as unknown as typeof fetch;
        const { usePersonnel } = await import("@/lib/hooks/usePersonnel");
        renderHook(() => usePersonnel(""), { wrapper: createWrapper() });
        await new Promise((r) => setTimeout(r, 10));
        expect(fetch).not.toHaveBeenCalled();
    });

    it("fetches personnel detail and handles error path", async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { id: "p1", sicilNo: "1001", fullName: "X" } }),
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: "failed" }),
            }) as unknown as typeof fetch;

        const { usePersonnel } = await import("@/lib/hooks/usePersonnel");

        const ok = renderHook(() => usePersonnel("p1"), { wrapper: createWrapper() });
        await waitFor(() => expect(ok.result.current.isSuccess).toBe(true));

        const bad = renderHook(() => usePersonnel("p2"), { wrapper: createWrapper() });
        await waitFor(() => expect(bad.result.current.isError).toBe(true));
    });

    it("runs create, update and delete mutations and invalidates cache", async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { id: "p1" } }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { id: "p1" } }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            }) as unknown as typeof fetch;

        const { useCreatePersonnel, useUpdatePersonnel, useDeletePersonnel } = await import("@/lib/hooks/usePersonnel");

        const createHook = renderHook(() => useCreatePersonnel(), { wrapper: createWrapper() });
        const updateHook = renderHook(() => useUpdatePersonnel(), { wrapper: createWrapper() });
        const deleteHook = renderHook(() => useDeletePersonnel(), { wrapper: createWrapper() });

        await act(async () => {
            await createHook.result.current.mutateAsync({ sicilNo: "1", fullName: "A" });
        });
        await act(async () => {
            await updateHook.result.current.mutateAsync({ id: "p1", data: { fullName: "B" } });
        });
        await act(async () => {
            await deleteHook.result.current.mutateAsync("p1");
        });

        expect(invalidatePersonnelCacheMock).toHaveBeenCalled();
    });

    it("throws mutation errors when response is not ok", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ message: "create failed" }),
        }) as unknown as typeof fetch;

        const { useCreatePersonnel } = await import("@/lib/hooks/usePersonnel");
        const hook = renderHook(() => useCreatePersonnel(), { wrapper: createWrapper() });

        await expect(
            hook.result.current.mutateAsync({ sicilNo: "x", fullName: "y" })
        ).rejects.toThrow("create failed");
    });
});

