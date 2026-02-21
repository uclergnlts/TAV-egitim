import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

const invalidateTrainingCacheMock = vi.fn();

vi.mock("@/lib/queryClient", async () => {
    const actual = await vi.importActual<typeof import("@/lib/queryClient")>("@/lib/queryClient");
    return {
        ...actual,
        invalidateTrainingCache: invalidateTrainingCacheMock,
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

describe("useTrainings hooks", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("fetches training detail when id is provided", async () => {
        const mockData = { success: true, data: { id: "t1", code: "E1", name: "Egitim" } };
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockData,
        }) as unknown as typeof fetch;

        const { useTraining } = await import("@/lib/hooks/useTrainings");
        const { result } = renderHook(() => useTraining("t1"), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockData);
        expect(fetch).toHaveBeenCalledWith("/api/trainings?id=t1");
    });

    it("does not fetch training detail when id is empty", async () => {
        global.fetch = vi.fn() as unknown as typeof fetch;
        const { useTraining } = await import("@/lib/hooks/useTrainings");
        renderHook(() => useTraining(""), { wrapper: createWrapper() });
        await new Promise((r) => setTimeout(r, 10));
        expect(fetch).not.toHaveBeenCalled();
    });

    it("handles topics fetch error", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ message: "err" }),
        }) as unknown as typeof fetch;

        const { useTrainingTopics } = await import("@/lib/hooks/useTrainings");
        const { result } = renderHook(() => useTrainingTopics("t1"), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it("runs create, update and delete mutations", async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { id: "n1", code: "N1", name: "Yeni" } }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { id: "n1", code: "N1", name: "Guncel" } }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            }) as unknown as typeof fetch;

        const { useCreateTraining, useUpdateTraining, useDeleteTraining } = await import("@/lib/hooks/useTrainings");

        const createHook = renderHook(() => useCreateTraining(), { wrapper: createWrapper() });
        const updateHook = renderHook(() => useUpdateTraining(), { wrapper: createWrapper() });
        const deleteHook = renderHook(() => useDeleteTraining(), { wrapper: createWrapper() });

        await act(async () => {
            await createHook.result.current.mutateAsync({ code: "N1", name: "Yeni" });
        });
        await act(async () => {
            await updateHook.result.current.mutateAsync({ id: "n1", data: { name: "Guncel" } });
        });
        await act(async () => {
            await deleteHook.result.current.mutateAsync("n1");
        });

        expect(invalidateTrainingCacheMock).toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledWith(
            "/api/trainings",
            expect.objectContaining({ method: "POST" })
        );
        expect(fetch).toHaveBeenCalledWith(
            "/api/trainings",
            expect.objectContaining({ method: "PUT" })
        );
        expect(fetch).toHaveBeenCalledWith(
            "/api/trainings?id=n1",
            expect.objectContaining({ method: "DELETE" })
        );
    });

    it("throws mutation errors when response is not ok", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ message: "failed" }),
        }) as unknown as typeof fetch;

        const { useCreateTraining } = await import("@/lib/hooks/useTrainings");
        const hook = renderHook(() => useCreateTraining(), { wrapper: createWrapper() });

        await expect(
            hook.result.current.mutateAsync({ code: "X", name: "Y" })
        ).rejects.toThrow("failed");
    });

    it("handles trainings list query error", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ message: "list failed" }),
        }) as unknown as typeof fetch;

        const { useTrainings } = await import("@/lib/hooks/useTrainings");
        const { result } = renderHook(() => useTrainings(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it("throws default update/delete error messages when response is not ok and no message", async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            }) as unknown as typeof fetch;

        const { useUpdateTraining, useDeleteTraining } = await import("@/lib/hooks/useTrainings");
        const updateHook = renderHook(() => useUpdateTraining(), { wrapper: createWrapper() });
        const deleteHook = renderHook(() => useDeleteTraining(), { wrapper: createWrapper() });

        await expect(
            updateHook.result.current.mutateAsync({ id: "t1", data: { name: "x" } })
        ).rejects.toThrow("Eğitim güncellenemedi");
        await expect(deleteHook.result.current.mutateAsync("t1")).rejects.toThrow("Eğitim silinemedi");
    });
});
