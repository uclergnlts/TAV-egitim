import { describe, it, expect, vi, beforeEach } from "vitest";

describe("queryClient advanced helpers", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("prefetches common definition data", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        }) as unknown as typeof fetch;

        const mod = await import("@/lib/queryClient");
        const prefetchSpy = vi
            .spyOn(mod.queryClient, "prefetchQuery")
            .mockResolvedValue(undefined as never);

        await mod.prefetchCommonData();

        expect(prefetchSpy).toHaveBeenCalledTimes(2);
        expect(prefetchSpy).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                queryKey: mod.queryKeys.definitions.groups(),
            })
        );
        expect(prefetchSpy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                queryKey: mod.queryKeys.definitions.locations(),
            })
        );
    });

    it("invalidates personnel/training/attendance/report caches", async () => {
        const mod = await import("@/lib/queryClient");
        const invalidateSpy = vi
            .spyOn(mod.queryClient, "invalidateQueries")
            .mockResolvedValue(undefined as never);

        mod.invalidatePersonnelCache();
        mod.invalidateTrainingCache();
        mod.invalidateAttendanceCache();
        mod.invalidateReportCache();

        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mod.queryKeys.personnel.all });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mod.queryKeys.trainings.all });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mod.queryKeys.attendances.all });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mod.queryKeys.dashboard.all });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mod.queryKeys.reports.all });
    });
});

