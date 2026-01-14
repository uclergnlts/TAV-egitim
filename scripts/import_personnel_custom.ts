
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { db } from "@/lib/db";
import { personnel } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function importPersonnel() {
    const filePath = path.join(process.cwd(), 'doc', 'Personeller.xlsx');

    if (!fs.existsSync(filePath)) {
        console.error("❌ Dosya bulunamadı:", filePath);
        return;
    }

    console.log("📂 Excel okunuyor...");
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Header row 1 (index 0) kabul edelim
    const data = XLSX.utils.sheet_to_json(sheet, {
        raw: false, // Her şeyi string olarak al
        defval: ""  // Boş hücreleri boş string yap
    });

    console.log(`📊 Toplam ${data.length} satır bulundu.`);

    let successCount = 0;
    let failCount = 0;

    for (const row: any of data) {
        // Kolon isimlerini temizleyelim (boşluklar vs)
        // Headerlar: SIRA NO, Cinsiyet, SİCİL NO, ADI , SOYADI, \r\nT.C. KİMLİK\r\n , GRUBU, IKAMETGAH ADRESI, CEP TEL NO

        try {
            const rawSicil = row["SİCİL NO"];
            const rawAd = row["ADI "]?.trim();
            const rawSoyad = row["SOYADI"]?.trim();
            const rawTc = row["\r\nT.C. KİMLİK\r\n "] || row["T.C. KİMLİK"] || row["TC KIMLIK"] || ""; // Farklı varyasyonlar olabilir
            const rawGrup = row["GRUBU"];
            const rawAdres = row["IKAMETGAH ADRESI"];
            const rawTel = row["CEP TEL NO"];
            const rawCinsiyet = row["Cinsiyet"];

            if (!rawSicil) continue; // Sicil yoksa atla

            // Veri temizliği
            const sicilNo = String(rawSicil).trim();
            const fullName = `${rawAd} ${rawSoyad}`;
            const tcKimlikNo = String(rawTc).replace(/\s/g, '').trim();

            // Cinsiyet map
            let cinsiyet = null;
            if (rawCinsiyet) {
                const c = rawCinsiyet.trim().toUpperCase();
                if (c === "E" || c === "ERKEK") cinsiyet = "ERKEK";
                else if (c === "K" || c === "KADIN" || c === "BAYAN") cinsiyet = "KADIN";
            }

            await db.insert(personnel).values({
                sicilNo: sicilNo,
                fullName: fullName,
                tcKimlikNo: tcKimlikNo || "00000000000", // TC yoksa placeholder
                gorevi: "Personel", // Default
                projeAdi: "TAV ESB", // Default
                grup: rawGrup || "Genel",
                adres: rawAdres || null,
                telefon: rawTel || null,
                cinsiyet: cinsiyet as any,
                personelDurumu: "CALISAN",
                passwordHash: "default", // Kullanılmıyor ama schema hatası olmasın diye (schema'da yok gerçi)
            });

            successCount++;
            if (successCount % 50 === 0) process.stdout.write(".");

        } catch (error: any) {
            failCount++;
            console.error(`\n❌ Satır hatası (${row["SİCİL NO"]}):`, error.message);
        }
    }

    console.log(`\n\n✅ İşlem Tamamlandı.`);
    console.log(`Başarılı: ${successCount}`);
    console.log(`Hatalı: ${failCount}`);
}

importPersonnel();
