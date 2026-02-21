import { describe, expect, it } from "vitest";
import {
    normalizeDate,
    normalizeTime,
    normalizeDateTime,
    normalizeIcDis,
    normalizeDocumentType,
} from "@/app/api/import/attendance/route";

describe("attendance import normalize helpers", () => {
    it("normalizes DD.MM.YYYY to YYYY-MM-DD", () => {
        expect(normalizeDate("06.04.2024")).toBe("2024-04-06");
    });

    it("uses fallback for empty time", () => {
        expect(normalizeTime("", "17:00")).toBe("17:00");
    });

    it("normalizes date-only value to ISO datetime", () => {
        const val = normalizeDateTime("06.04.2024");
        expect(val).toBeTruthy();
        expect(val?.startsWith("2024-04-06T00:00:00")).toBe(true);
    });

    it("normalizes ic/dis values including Turkish text", () => {
        expect(normalizeIcDis("Hizmet İçi")).toBe("IC");
        expect(normalizeIcDis("Hizmet Dışı")).toBe("DIS");
    });

    it("normalizes document type values", () => {
        expect(normalizeDocumentType("Eğitim Katılım Çizelgesi")).toBe("EGITIM_KATILIM_CIZELGESI");
        expect(normalizeDocumentType("Sertifika")).toBe("SERTIFIKA");
    });
});
