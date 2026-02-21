import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();
const dbInsertMock = vi.fn();
const dbValuesMock = vi.fn();

vi.mock("next/headers", () => ({
    headers: headersMock,
}));

vi.mock("@/lib/db/schema", () => ({
    auditLogs: { __table: "audit_logs" },
}));

vi.mock("@/lib/db", () => ({
    db: {
        insert: dbInsertMock,
    },
}));

describe("lib/audit", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        dbInsertMock.mockReturnValue({ values: dbValuesMock });
        dbValuesMock.mockResolvedValue(undefined);
    });

    it("inserts audit log with serialized values and header metadata", async () => {
        headersMock.mockResolvedValue({
            get: (k: string) => {
                if (k === "x-forwarded-for") return "10.0.0.1";
                if (k === "user-agent") return "vitest";
                return null;
            },
        });

        const { logAction } = await import("@/lib/audit");
        await logAction({
            userId: "u1",
            userRole: "ADMIN",
            actionType: "UPDATE",
            entityType: "attendance",
            entityId: "a1",
            oldValue: { before: true },
            newValue: { after: true },
        });

        expect(dbInsertMock).toHaveBeenCalled();
        expect(dbValuesMock).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "u1",
                userRole: "ADMIN",
                actionType: "UPDATE",
                entityType: "attendance",
                entityId: "a1",
                oldValue: JSON.stringify({ before: true }),
                newValue: JSON.stringify({ after: true }),
                ipAddress: "10.0.0.1",
                userAgent: "vitest",
            })
        );
    });

    it("uses unknown defaults when headers are absent", async () => {
        headersMock.mockResolvedValue({
            get: () => null,
        });

        const { logAction } = await import("@/lib/audit");
        await logAction({
            userId: "u2",
            userRole: "CHEF",
            actionType: "CREATE",
            entityType: "training",
        });

        expect(dbValuesMock).toHaveBeenCalledWith(
            expect.objectContaining({
                ipAddress: "unknown",
                userAgent: "unknown",
                oldValue: null,
                newValue: null,
            })
        );
    });

    it("does not throw when insert fails and logs error context", async () => {
        headersMock.mockResolvedValue({
            get: () => null,
        });
        dbValuesMock.mockRejectedValueOnce(new Error("db fail"));
        const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

        const { logAction } = await import("@/lib/audit");
        await expect(
            logAction({
                userId: "u3",
                userRole: "ADMIN",
                actionType: "DELETE",
                entityType: "user",
                entityId: "u3",
            })
        ).resolves.toBeUndefined();

        expect(errSpy).toHaveBeenCalledWith(
            "AUDIT_LOG_ERROR:",
            expect.objectContaining({
                action: "DELETE",
                entity: "user",
                entityId: "u3",
                userId: "u3",
                error: "db fail",
            })
        );
    });
});

