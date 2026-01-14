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
