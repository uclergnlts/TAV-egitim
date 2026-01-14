
import * as XLSX from "xlsx";
import path from "path";
import { db } from "@/lib/db";
import { personnel } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function checkMissing() {
    console.log("🔍 Eksik personeller aranıyor...");

    // 1. Excel'i Oku
    const filePath = path.join(process.cwd(), 'doc', 'Personeller.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: "" });

    const missingList = [];
    let emptySicilCount = 0;

    // 2. DB'deki tüm sicilleri çek (Performans için toplu çekelim)
    // Ancak 800 kayıt az, tek tek sorgulasak da olur ama toplu daha iyi.
    const allPersonnel = await db.select({ sicilNo: personnel.sicilNo }).from(personnel);
    const dbSicilSet = new Set(allPersonnel.map(p => p.sicilNo));

    console.log(`📊 Excel Satır Sayısı: ${data.length}`);
    console.log(`📊 DB Kayıt Sayısı: ${dbSicilSet.size}`);

    // 3. Karşılaştır
    for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        const rawSicil = row["SİCİL NO"];
        const ad = row["ADI "]?.trim();
        const soyad = row["SOYADI"]?.trim();

        // Sicil no boşsa
        if (!rawSicil) {
            emptySicilCount++;
            // console.log(`⚠️ Satır ${i+2}: Sicil No Boş - ${ad} ${soyad}`);
            continue;
        }

        const sicilNo = String(rawSicil).trim();

        // DB'de yoksa
        if (!dbSicilSet.has(sicilNo)) {
            missingList.push({
                row: i + 2, // 1-based index (header is 1)
                sicil: sicilNo,
                name: `${ad} ${soyad}`
            });
        }
    }

    console.log("\n❌ EKLENEMEYEN PERSONELLER:");
    console.log("-----------------------------------------");
    missingList.forEach(p => {
        console.log(`Row ${p.row}: [${p.sicil}] ${p.name}`);
    });

    if (emptySicilCount > 0) {
        console.log(`\n⚠️ Ayrıyeten ${emptySicilCount} satırda SİCİL NO eksikti (boş satır olabilir).`);
    }
}

checkMissing();
