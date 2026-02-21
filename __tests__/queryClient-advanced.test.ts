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

    it("runs real prefetch query functions and hits definition endpoints", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });
        global.fetch = fetchMock as unknown as typeof fetch;

        const mod = await import("@/lib/queryClient");
        await mod.queryClient.clear();
        await mod.prefetchCommonData();

        expect(fetchMock).toHaveBeenCalledWith("/api/definitions/groups");
        expect(fetchMock).toHaveBeenCalledWith("/api/definitions/locations");
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

    it("covers remaining query key builders", async () => {
        const mod = await import("@/lib/queryClient");

        expect(mod.queryKeys.personnel.detail("p1")).toEqual(["personnel", "detail", "p1"]);
        expect(mod.queryKeys.trainings.list()).toEqual(["trainings", "list"]);
        expect(mod.queryKeys.trainings.list({ q: "x" })).toEqual(["trainings", "list", { q: "x" }]);
        expect(mod.queryKeys.trainers.list()).toEqual(["trainers", "list"]);
        expect(mod.queryKeys.attendances.list({ page: 1 })).toEqual(["attendances", "list", { page: 1 }]);
        expect(mod.queryKeys.attendances.my()).toEqual(["attendances", "my"]);
        expect(mod.queryKeys.reports.monthly(2025, 1)).toEqual(["reports", "monthly", 2025, 1]);
        expect(mod.queryKeys.reports.yearly(2025)).toEqual(["reports", "yearly", 2025]);
        expect(mod.queryKeys.reports.detail({ sicil: "1001" })).toEqual(["reports", "detail", { sicil: "1001" }]);
        expect(mod.queryKeys.reports.statistics()).toEqual(["reports", "statistics"]);
        expect(mod.queryKeys.users.list()).toEqual(["users", "list"]);
        expect(mod.queryKeys.users.me()).toEqual(["users", "me"]);
        expect(mod.queryKeys.auditLogs.list(3)).toEqual(["auditLogs", "list", 3]);
        expect(mod.queryKeys.definitions.documents()).toEqual(["definitions", "documents"]);
    });
});
