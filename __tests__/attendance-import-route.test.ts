import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const logActionMock = vi.fn();
const checkRateLimitMock = vi.fn();
const getClientIPMock = vi.fn();

const dbMock = {
    query: {
        personnel: { findFirst: vi.fn() },
        trainings: { findFirst: vi.fn() },
        trainers: { findFirst: vi.fn() },
        attendances: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
};

const personnelTable = { sicilNo: "sicil_no", id: "id" };
const trainingsTable = { code: "code", id: "id" };
const trainersTable = { sicilNo: "sicil_no", id: "id" };
const attendancesTable = { personelId: "personel_id", trainingId: "training_id", year: "year" };

vi.mock("@/lib/auth", () => ({
    getSession: getSessionMock,
}));

vi.mock("@/lib/audit", () => ({
    logAction: logActionMock,
}));

vi.mock("@/lib/rateLimit", () => ({
    checkRateLimit: checkRateLimitMock,
    getClientIP: getClientIPMock,
    RateLimitPresets: { export: { windowMs: 60_000, max: 60 } },
}));

vi.mock("@/lib/db", () => ({
    db: dbMock,
    attendances: attendancesTable,
    personnel: personnelTable,
    trainings: trainingsTable,
    trainers: trainersTable,
}));

vi.mock("drizzle-orm", () => ({
    eq: vi.fn(() => ({})),
    and: vi.fn(() => ({})),
}));

describe("POST /api/import/attendance", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getClientIPMock.mockReturnValue("127.0.0.1");
        checkRateLimitMock.mockReturnValue({
            allowed: true,
            limit: 60,
            remaining: 59,
            resetTime: Date.now() + 60_000,
        });
        getSessionMock.mockResolvedValue({
            userId: "u1",
            role: "ADMIN",
            sicilNo: "A001",
            fullName: "Admin User",
        });
        dbMock.insert.mockImplementation(() => ({
            values: vi.fn().mockResolvedValue(undefined),
        }));
    });

    it("returns 429 when rate limit exceeded", async () => {
        checkRateLimitMock.mockReturnValueOnce({
            allowed: false,
            limit: 60,
            remaining: 0,
            resetTime: Date.now() + 60_000,
        });
        const { POST } = await import("@/app/api/import/attendance/route");
        const req = new Request("http://localhost/api/import/attendance", {
            method: "POST",
            body: JSON.stringify({ data: [{ sicilNo: "1", egitimKodu: "E1", baslamaTarihi: "2025-01-01" }] }),
            headers: { "Content-Type": "application/json" },
        });

        const res = await POST(req as never);
        const json = await res.json();
        expect(res.status).toBe(429);
        expect(json.success).toBe(false);
    });

    it("returns 403 for non-admin session", async () => {
        getSessionMock.mockResolvedValueOnce({ role: "CHEF" });
        const { POST } = await import("@/app/api/import/attendance/route");
        const req = new Request("http://localhost/api/import/attendance", {
            method: "POST",
            body: JSON.stringify({ data: [{ sicilNo: "1", egitimKodu: "E1", baslamaTarihi: "2025-01-01" }] }),
            headers: { "Content-Type": "application/json" },
        });

        const res = await POST(req as never);
        expect(res.status).toBe(403);
    });

    it("returns 400 when data is empty", async () => {
        const { POST } = await import("@/app/api/import/attendance/route");
        const req = new Request("http://localhost/api/import/attendance", {
            method: "POST",
            body: JSON.stringify({ data: [] }),
            headers: { "Content-Type": "application/json" },
        });

        const res = await POST(req as never);
        expect(res.status).toBe(400);
    });

    it("creates attendance and personnel when missing", async () => {
        dbMock.query.personnel.findFirst
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: "p1",
                sicilNo: "1001",
                fullName: "Person One",
                tcKimlikNo: "11111111111",
                gorevi: "Guvenlik",
                projeAdi: "TAV",
                grup: "Genel",
                personelDurumu: "CALISAN",
            });
        dbMock.query.trainings.findFirst.mockResolvedValueOnce({
            id: "t1",
            code: "E1",
            durationMin: 60,
            defaultDocumentType: "SERTIFIKA",
            defaultLocation: "Salon",
        });
        dbMock.query.attendances.findFirst.mockResolvedValueOnce(null);
        dbMock.query.trainers.findFirst.mockResolvedValueOnce({ id: "tr1", sicilNo: "TR001" });

        const { POST } = await import("@/app/api/import/attendance/route");
        const req = new Request("http://localhost/api/import/attendance", {
            method: "POST",
            body: JSON.stringify({
                data: [
                    {
                        sicilNo: "1001",
                        adiSoyadi: "Person One",
                        egitimKodu: "E1",
                        baslamaTarihi: "06.04.2024",
                        bitisTarihi: "06.04.2024",
                        baslamaSaati: "09:00",
                        bitisSaati: "10:00",
                        egitmenSicil: "TR001",
                        sonucBelgesiTuru: "Sertifika",
                    },
                ],
            }),
            headers: { "Content-Type": "application/json" },
        });

        const res = await POST(req as never);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data.created).toBe(1);
        expect(json.data.createdPersonnel).toBe(1);
        expect(dbMock.insert).toHaveBeenCalled();
        expect(logActionMock).toHaveBeenCalled();
    });

    it("handles invalid row and duplicate attendance skip", async () => {
        dbMock.query.personnel.findFirst.mockResolvedValueOnce({
            id: "p2",
            sicilNo: "2002",
            fullName: "Person Two",
            tcKimlikNo: "22222222222",
            gorevi: "Operator",
            projeAdi: "TAV",
            grup: "Genel",
            personelDurumu: "CALISAN",
        });
        dbMock.query.trainings.findFirst.mockResolvedValueOnce({
            id: "t2",
            code: "E2",
            durationMin: 90,
            defaultDocumentType: "EGITIM_KATILIM_CIZELGESI",
            defaultLocation: "Sinif",
        });
        dbMock.query.attendances.findFirst.mockResolvedValueOnce({ id: "existing" });

        const { POST } = await import("@/app/api/import/attendance/route");
        const req = new Request("http://localhost/api/import/attendance", {
            method: "POST",
            body: JSON.stringify({
                data: [
                    { sicilNo: "", egitimKodu: "E2", baslamaTarihi: "2024-01-01" },
                    { sicilNo: "2002", egitimKodu: "E2", baslamaTarihi: "2024-01-01" },
                ],
            }),
            headers: { "Content-Type": "application/json" },
        });

        const res = await POST(req as never);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data.created).toBe(0);
        expect(json.data.skipped).toBe(1);
        expect(json.data.errors.length).toBe(1);
    });
});

