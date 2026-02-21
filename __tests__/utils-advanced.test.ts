import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
    api,
    calculateEndTime,
    chunk,
    deepClone,
    debounce,
    formatDuration,
    generateId,
    groupBy,
    isNonEmptyString,
    isValidDateString,
    isValidSicilNo,
    isValidTimeString,
    loadFromStorage,
    parseSicilNos,
    removeFromStorage,
    saveToStorage,
    unique,
} from "../lib/utils";

describe("Utils Advanced", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("validates string/date/time/sicil helpers", () => {
        expect(isNonEmptyString(" abc ")).toBe(true);
        expect(isNonEmptyString("   ")).toBe(false);
        expect(isNonEmptyString(123)).toBe(false);

        expect(isValidDateString("2025-01-01")).toBe(true);
        expect(isValidDateString("not-a-date")).toBe(false);

        expect(isValidTimeString("00:00")).toBe(true);
        expect(isValidTimeString("23:59")).toBe(true);
        expect(isValidTimeString("24:00")).toBe(false);
        expect(isValidTimeString("12:60")).toBe(false);

        expect(isValidSicilNo("ABC123")).toBe(true);
        expect(isValidSicilNo(" 123 ")).toBe(true);
        expect(isValidSicilNo("a")).toBe(false);
        expect(isValidSicilNo("ab#12")).toBe(false);
    });

    it("parses sicil list with valid/invalid/duplicates", () => {
        const parsed = parseSicilNos("12345,\nabc,\nabc,\n@@,\n  999");
        expect(parsed.valid).toEqual(["12345", "abc", "999"]);
        expect(parsed.invalid).toEqual(["@@"]);
        expect(parsed.duplicates).toEqual(["abc"]);
    });

    it("calculates end time and formats duration", () => {
        expect(calculateEndTime("09:30", 90)).toBe("11:00");
        expect(calculateEndTime("23:30", 90)).toBe("01:00");
        expect(calculateEndTime("bad", 30)).toBeNull();
        expect(calculateEndTime("10:00", 0)).toBeNull();

        expect(formatDuration(45)).toBe("45 dk");
        expect(formatDuration(60)).toBe("1 sa");
        expect(formatDuration(135)).toBe("2 sa 15 dk");
    });

    it("debounces function calls", () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 200);

        debounced("a");
        debounced("b");
        debounced("c");

        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(199);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith("c");
    });

    it("clones objects deeply and generates ids", () => {
        const source = { a: 1, nested: { b: 2 } };
        const cloned = deepClone(source);
        expect(cloned).toEqual(source);
        cloned.nested.b = 99;
        expect(source.nested.b).toBe(2);

        const id1 = generateId();
        const id2 = generateId();
        expect(id1).toContain("-");
        expect(id1).not.toBe(id2);
    });

    it("groups, deduplicates and chunks arrays", () => {
        const items = [
            { type: "A", value: 1 },
            { type: "A", value: 2 },
            { type: "B", value: 3 },
        ];
        expect(groupBy(items, "type")).toEqual({
            A: [
                { type: "A", value: 1 },
                { type: "A", value: 2 },
            ],
            B: [{ type: "B", value: 3 }],
        });
        expect(unique([1, 1, 2, 3, 3])).toEqual([1, 2, 3]);
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("saves and loads storage with and without ttl", () => {
        const nowSpy = vi.spyOn(Date, "now");
        nowSpy.mockReturnValue(1000);

        saveToStorage("k1", { ok: true });
        expect(loadFromStorage<{ ok: boolean }>("k1")).toEqual({ ok: true });

        saveToStorage("k2", { exp: true }, 1); // 1 min
        nowSpy.mockReturnValue(1000 + 30_000);
        expect(loadFromStorage<{ exp: boolean }>("k2")).toEqual({ exp: true });
        nowSpy.mockReturnValue(1000 + 61_000);
        expect(loadFromStorage("k2")).toBeNull();
        expect(localStorage.getItem("k2")).toBeNull();
    });

    it("handles storage errors safely", () => {
        const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("set error");
        });
        const getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("get error");
        });
        const rmSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
            throw new Error("rm error");
        });
        const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

        saveToStorage("x", { a: 1 });
        expect(loadFromStorage("x")).toBeNull();
        removeFromStorage("x");

        expect(setSpy).toHaveBeenCalled();
        expect(getSpy).toHaveBeenCalled();
        expect(rmSpy).toHaveBeenCalled();
        expect(errSpy).toHaveBeenCalled();
    });

    it("calls api helper with merged headers", async () => {
        const fetchMock = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

        await api("/test", {
            method: "POST",
            headers: {
                Authorization: "Bearer token",
            },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "/test",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                    Authorization: "Bearer token",
                }),
            })
        );
    });
});

