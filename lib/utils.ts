import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// CSS Sınıf İşlemleri
// ============================================

/** Tailwind class'larını birleştirir, çakışanları çözer */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ============================================
// Tarih ve Saat Formatlama
// ============================================

/** Tarihi Türkçe formata çevirir (DD.MM.YYYY) */
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString("tr-TR");
}

/** Saati HH:MM formatına çevirir */
export function formatTime(time: string): string {
    return time.substring(0, 5);
}

/** Tarihten yılı alır */
export function getYear(date: Date | string): number {
    return new Date(date).getFullYear();
}

/** Tarihten ayı alır (1-12) */
export function getMonth(date: Date | string): number {
    return new Date(date).getMonth() + 1;
}

/** Ay isimleri (Türkçe) */
export const MONTHS_TR = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

// ============================================
// Sabit Değerler (Labels)
// ============================================

/** Personel durumu seçenekleri */
export const PERSONEL_DURUMU = {
    CALISAN: "Çalışan",
    AYRILDI: "Ayrıldı",
    IZINLI: "İzinli",
    PASIF: "Pasif",
} as const;

/** Eğitim yeri seçenekleri */
export const EGITIM_YERI = {
    CIHAZ_BASINDA: "Cihaz Başında",
    EGITIM_KURUMUNDA: "Eğitim Kurumunda",
    DIGER: "Diğer",
} as const;

/** Belge türü seçenekleri */
export const BELGE_TURU = {
    EGITIM_KATILIM_CIZELGESI: "Eğitim Katılım Çizelgesi",
    SERTIFIKA: "Sertifika",
} as const;

/** Eğitim kategorileri */
export const EGITIM_KATEGORISI = {
    TEMEL: "Temel",
    TAZELEME: "Tazeleme",
    DIGER: "Diğer",
} as const;

// ============================================
// Tip Kontrolleri ve Doğrulama
// ============================================

/** Değer boş olmayan string mi kontrol eder */
export function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

/** Geçerli tarih string'i mi kontrol eder */
export function isValidDateString(value: unknown): value is string {
    if (typeof value !== "string") return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
}

/** Geçerli saat formatı mı kontrol eder (HH:MM) */
export function isValidTimeString(value: unknown): value is string {
    if (typeof value !== "string") return false;
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
}

/** Sicil numarası formatını doğrular (3-20 karakter, alfanümerik) */
export function isValidSicilNo(sicilNo: string): boolean {
    return /^[a-zA-Z0-9]{3,20}$/.test(sicilNo.trim());
}

/**
 * Sicil numaralarını string'den ayıklar
 * Virgül veya satır sonu ile ayrılmış sicilleri parse eder
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

// ============================================
// Form İşlemleri
// ============================================

/**
 * Başlangıç saatine süre ekleyerek bitiş saati hesaplar
 * @param startTime - Başlangıç saati (HH:MM)
 * @param durationMinutes - Süre (dakika)
 * @returns Bitiş saati (HH:MM) veya null
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

/** Dakika cinsinden süreyi okunabilir formata çevirir */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} dk`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} sa ${mins} dk` : `${hours} sa`;
}

/**
 * Arama input'ları için debounce fonksiyonu
 * Belirli süre geçmeden fonksiyonu çalıştırmaz
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

/** Nesneyi derin kopyalar */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/** Benzersiz ID üretir */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Dizi İşlemleri
// ============================================

/** Diziyi belirli anahtara göre gruplar */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
        const groupKey = String(item[key]);
        return {
            ...groups,
            [groupKey]: [...(groups[groupKey] || []), item],
        };
    }, {} as Record<string, T[]>);
}

/** Diziden tekrarları kaldırır */
export function unique<T>(array: T[]): T[] {
    return [...new Set(array)];
}

/** Diziyi belirli boyutta parçalara böler */
export function chunk<T>(array: T[], size: number): T[][] {
    return array.reduce((chunks, item, index) => {
        const chunkIndex = Math.floor(index / size);
        chunks[chunkIndex] = [...(chunks[chunkIndex] || []), item];
        return chunks;
    }, [] as T[][]);
}

// ============================================
// LocalStorage İşlemleri
// ============================================

/**
 * LocalStorage'a veri kaydeder (opsiyonel süre sınırı ile)
 * @param key - Anahtar
 * @param data - Kaydedilecek veri
 * @param ttlMinutes - Süre sınırı (dakika), opsiyonel
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
 * LocalStorage'dan veri yükler (süre kontrolü ile)
 * Süresi geçmişse otomatik siler
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

/** LocalStorage'dan veri siler */
export function removeFromStorage(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error("localStorage remove error:", e);
    }
}

// ============================================
// API İşlemleri
// ============================================

/**
 * HTTP istekleri için yardımcı fonksiyon
 * JSON header'larını otomatik ekler
 */
export async function api(
    url: string,
    options?: RequestInit
): Promise<Response> {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });
    return response;
}
