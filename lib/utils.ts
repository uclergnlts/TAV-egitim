import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format date to Turkish locale (DD.MM.YYYY)
 */
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString("tr-TR");
}

/**
 * Format time (HH:MM)
 */
export function formatTime(time: string): string {
    return time.substring(0, 5);
}

/**
 * Get year from date
 */
export function getYear(date: Date | string): number {
    return new Date(date).getFullYear();
}

/**
 * Get month from date (1-12)
 */
export function getMonth(date: Date | string): number {
    return new Date(date).getMonth() + 1;
}

/**
 * Month names in Turkish
 */
export const MONTHS_TR = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
];

/**
 * Personel durumu labels
 */
export const PERSONEL_DURUMU = {
    CALISAN: "Çalışan",
    AYRILDI: "Ayrıldı",
    IZINLI: "İzinli",
    PASIF: "Pasif",
} as const;

/**
 * Eğitim yeri labels
 */
export const EGITIM_YERI = {
    CIHAZ_BASINDA: "Cihaz Başında",
    EGITIM_KURUMUNDA: "Eğitim Kurumunda",
    DIGER: "Diğer",
} as const;

/**
 * Belge türü labels
 */
export const BELGE_TURU = {
    EGITIM_KATILIM_CIZELGESI: "Eğitim Katılım Çizelgesi",
    SERTIFIKA: "Sertifika",
} as const;

/**
 * Eğitim kategorileri
 */
export const EGITIM_KATEGORISI = {
    TEMEL: "Temel",
    TAZELEME: "Tazeleme",
    DIGER: "Diğer",
} as const;

// ==================== TYPE GUARDS & VALIDATION ====================

/**
 * Type guard: Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

/**
 * Type guard: Check if value is a valid date string
 */
export function isValidDateString(value: unknown): value is string {
    if (typeof value !== "string") return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
}

/**
 * Type guard: Check if value is a valid time string (HH:MM)
 */
export function isValidTimeString(value: unknown): value is string {
    if (typeof value !== "string") return false;
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
}

/**
 * Validate sicil number format (alphanumeric, 3-20 chars)
 */
export function isValidSicilNo(sicilNo: string): boolean {
    return /^[a-zA-Z0-9]{3,20}$/.test(sicilNo.trim());
}

/**
 * Parse and validate sicil numbers from string
 * Returns object with valid and invalid sicils
 */
export function parseSicilNos(input: string): {
    valid: string[];
    invalid: string[];
    duplicates: string[];
} {
    const allSicils = input
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const seen = new Set<string>();
    const valid: string[] = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];

    for (const sicil of allSicils) {
        if (seen.has(sicil)) {
            duplicates.push(sicil);
            continue;
        }
        seen.add(sicil);

        if (isValidSicilNo(sicil)) {
            valid.push(sicil);
        } else {
            invalid.push(sicil);
        }
    }

    return { valid, invalid, duplicates };
}

// ==================== FORM UTILITIES ====================

/**
 * Calculate end time based on start time and duration
 */
export function calculateEndTime(
    startTime: string,
    durationMinutes: number
): string | null {
    if (!isValidTimeString(startTime) || durationMinutes <= 0) {
        return null;
    }

    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;

    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;

    return `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} dk`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} sa ${mins} dk` : `${hours} sa`;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== ARRAY UTILITIES ====================

/**
 * Group array items by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
        const groupKey = String(item[key]);
        return {
            ...groups,
            [groupKey]: [...(groups[groupKey] || []), item],
        };
    }, {} as Record<string, T[]>);
}

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
    return [...new Set(array)];
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
    return array.reduce((chunks, item, index) => {
        const chunkIndex = Math.floor(index / size);
        chunks[chunkIndex] = [...(chunks[chunkIndex] || []), item];
        return chunks;
    }, [] as T[][]);
}

// ==================== LOCAL STORAGE UTILITIES ====================

/**
 * Safely save to localStorage with expiration
 */
export function saveToStorage<T>(key: string, data: T, ttlMinutes?: number): void {
    try {
        const item = {
            data,
            expires: ttlMinutes ? Date.now() + ttlMinutes * 60 * 1000 : null,
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
        console.error("localStorage save error:", e);
    }
}

/**
 * Safely load from localStorage with expiration check
 */
export function loadFromStorage<T>(key: string): T | null {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const parsed = JSON.parse(item);
        if (parsed.expires && Date.now() > parsed.expires) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data as T;
    } catch (e) {
        console.error("localStorage load error:", e);
        return null;
    }
}

/**
 * Remove item from localStorage
 */
export function removeFromStorage(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error("localStorage remove error:", e);
    }
}
