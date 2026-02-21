import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
const compareMock = vi.fn();
const jwtVerifyMock = vi.fn();
const dbFindUserMock = vi.fn();

class SignJWTMock {
    payload: unknown;
    constructor(payload: unknown) {
        this.payload = payload;
    }
    setProtectedHeader() {
        return this;
    }
    setIssuedAt() {
        return this;
    }
    setExpirationTime() {
        return this;
    }
    sign() {
        return Promise.resolve("signed-token");
    }
}

vi.mock("next/headers", () => ({
    cookies: cookiesMock,
}));

vi.mock("bcryptjs", () => ({
    compare: compareMock,
}));

vi.mock("jose", () => ({
    SignJWT: SignJWTMock,
    jwtVerify: jwtVerifyMock,
}));

vi.mock("drizzle-orm", () => ({
    eq: vi.fn(() => ({})),
}));

vi.mock("@/lib/db", () => ({
    db: {
        query: {
            users: {
                findFirst: dbFindUserMock,
            },
        },
    },
    users: {
        sicilNo: "sicil_no",
    },
}));

describe("lib/auth", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = "test-secret";
    });

    it("logs in successfully and sets auth cookie", async () => {
        const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
        cookiesMock.mockResolvedValue(cookieStore);
        dbFindUserMock.mockResolvedValue({
            id: "u1",
            sicilNo: "1001",
            fullName: "Admin User",
            role: "ADMIN",
            isActive: true,
            passwordHash: "hashed",
        });
        compareMock.mockResolvedValue(true);

        const auth = await import("@/lib/auth");
        const result = await auth.login("1001", "pass");

        expect(result.success).toBe(true);
        expect(result.user?.id).toBe("u1");
        expect(cookieStore.set).toHaveBeenCalledWith(
            "auth_token",
            "signed-token",
            expect.objectContaining({ httpOnly: true, path: "/" })
        );
    });

    it("returns invalid credentials when user not found", async () => {
        const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
        cookiesMock.mockResolvedValue(cookieStore);
        dbFindUserMock.mockResolvedValue(null);

        const auth = await import("@/lib/auth");
        const result = await auth.login("X", "Y");

        expect(result.success).toBe(false);
        expect(result.message).toContain("Sicil");
        expect(cookieStore.set).not.toHaveBeenCalled();
    });

    it("returns passive account message", async () => {
        cookiesMock.mockResolvedValue({ set: vi.fn(), get: vi.fn(), delete: vi.fn() });
        dbFindUserMock.mockResolvedValue({
            id: "u2",
            sicilNo: "1002",
            fullName: "Chef User",
            role: "CHEF",
            isActive: false,
            passwordHash: "hashed",
        });

        const auth = await import("@/lib/auth");
        const result = await auth.login("1002", "pass");

        expect(result.success).toBe(false);
        expect(result.message).toContain("pasif");
    });

    it("returns invalid credentials when password mismatch", async () => {
        cookiesMock.mockResolvedValue({ set: vi.fn(), get: vi.fn(), delete: vi.fn() });
        dbFindUserMock.mockResolvedValue({
            id: "u3",
            sicilNo: "1003",
            fullName: "Chef User",
            role: "CHEF",
            isActive: true,
            passwordHash: "hashed",
        });
        compareMock.mockResolvedValue(false);

        const auth = await import("@/lib/auth");
        const result = await auth.login("1003", "wrong");

        expect(result.success).toBe(false);
        expect(result.message).toContain("Sicil");
    });

    it("returns generic login error when secret is missing", async () => {
        vi.resetModules();
        process.env.JWT_SECRET = "";
        const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
        cookiesMock.mockResolvedValue(cookieStore);
        dbFindUserMock.mockResolvedValue({
            id: "u4",
            sicilNo: "1004",
            fullName: "Admin",
            role: "ADMIN",
            isActive: true,
            passwordHash: "hashed",
        });
        compareMock.mockResolvedValue(true);

        const auth = await import("@/lib/auth");
        const result = await auth.login("1004", "pass");
        expect(result.success).toBe(false);
        expect(result.message).toContain("Giris");
    });

    it("verifies token and returns payload or null", async () => {
        const auth = await import("@/lib/auth");
        jwtVerifyMock.mockResolvedValueOnce({
            payload: { userId: "u1", sicilNo: "1", fullName: "X", role: "ADMIN" },
        });
        const ok = await auth.verifyToken("token");
        expect(ok?.role).toBe("ADMIN");

        jwtVerifyMock.mockRejectedValueOnce(new Error("bad token"));
        const bad = await auth.verifyToken("bad");
        expect(bad).toBeNull();
    });

    it("gets session from cookie and handles missing/errored cookie store", async () => {
        const auth = await import("@/lib/auth");

        const cookieStore = { set: vi.fn(), get: vi.fn(() => ({ value: "tok1" })), delete: vi.fn() };
        cookiesMock.mockResolvedValueOnce(cookieStore);
        jwtVerifyMock.mockResolvedValueOnce({
            payload: { userId: "u1", sicilNo: "1", fullName: "A", role: "CHEF" },
        });
        const s1 = await auth.getSession();
        expect(s1?.role).toBe("CHEF");

        cookiesMock.mockResolvedValueOnce({ set: vi.fn(), get: vi.fn(() => undefined), delete: vi.fn() });
        const s2 = await auth.getSession();
        expect(s2).toBeNull();

        cookiesMock.mockRejectedValueOnce(new Error("cookie error"));
        const s3 = await auth.getSession();
        expect(s3).toBeNull();
    });

    it("checks roles and admin/chef helpers", async () => {
        const auth = await import("@/lib/auth");
        cookiesMock.mockResolvedValue({
            set: vi.fn(),
            delete: vi.fn(),
            get: vi.fn(() => ({ value: "tok-role" })),
        });

        jwtVerifyMock.mockResolvedValueOnce({
            payload: { userId: "u1", sicilNo: "1", fullName: "A", role: "ADMIN" },
        });
        await expect(auth.hasRole("CHEF")).resolves.toBe(true);

        jwtVerifyMock.mockResolvedValueOnce({
            payload: { userId: "u2", sicilNo: "2", fullName: "B", role: "CHEF" },
        });
        await expect(auth.hasRole("ADMIN")).resolves.toBe(false);

        jwtVerifyMock.mockResolvedValueOnce({
            payload: { userId: "u3", sicilNo: "3", fullName: "C", role: "ADMIN" },
        });
        await expect(auth.isAdmin()).resolves.toBe(true);

        jwtVerifyMock.mockResolvedValueOnce({
            payload: { userId: "u4", sicilNo: "4", fullName: "D", role: "CHEF" },
        });
        await expect(auth.isChef()).resolves.toBe(true);
    });

    it("logs out by deleting auth cookie", async () => {
        const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
        cookiesMock.mockResolvedValue(cookieStore);
        const auth = await import("@/lib/auth");
        await auth.logout();
        expect(cookieStore.delete).toHaveBeenCalledWith("auth_token");
    });
});

