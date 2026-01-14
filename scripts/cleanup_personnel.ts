
import { db } from "@/lib/db";
import { personnel, attendances } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function cleanup() {
    console.log("🧹 Veritabanı temizliği başlıyor...");

    try {
        // 1. Önce katılım (attendances) tablosunu temizle (Foreign Key hatası almamak için)
        const attResult = await db.delete(attendances).returning({ id: attendances.id });
        console.log(`✅ ${attResult.length} adet katılım kaydı silindi.`);

        // 2. Personel tablosunu temizle
        const perResult = await db.delete(personnel).returning({ id: personnel.id });
        console.log(`✅ ${perResult.length} adet personel kaydı silindi.`);

        console.log("✨ Temizlik tamamlandı. Veritabanı gerçek veri girişine hazır.");
    } catch (error) {
        console.error("❌ Hata oluştu:", error);
    }
}

cleanup();
