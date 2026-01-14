
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

async function checkDuplicates() {
    console.log("🔍 Excel içi mükerrer kontrolü...");

    const filePath = path.join(process.cwd(), 'doc', 'Personeller.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: "" });

    const seenSicil = new Map(); // sicil -> [rows]
    const duplicates = [];

    for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        const rawSicil = row["SİCİL NO"];
        const ad = row["ADI "]?.trim();
        const soyad = row["SOYADI"]?.trim();

        if (!rawSicil) continue;

        const sicilNo = String(rawSicil).trim();

        if (seenSicil.has(sicilNo)) {
            duplicates.push({
                sicil: sicilNo,
                originalRow: seenSicil.get(sicilNo),
                duplicateRow: i + 2,
                name: `${ad} ${soyad}`
            });
            seenSicil.get(sicilNo).push(i + 2);
        } else {
            seenSicil.set(sicilNo, [i + 2]);
        }
    }

    console.log(`\n📊 Toplam Satır: ${data.length}`);
    console.log(`⚠️ Mükerrer Kayıt Sayısı: ${duplicates.length}`);

    if (duplicates.length > 0) {
        console.log("\n📋 MÜKERRER LİSTESİ (Excel içinde birden fazla geçenler):");
        console.log("-------------------------------------------------------");
        duplicates.forEach(d => {
            console.log(`Sicil: ${d.sicil} - ${d.name} (Satırlar: ${d.originalRow.join(', ')}, ${d.duplicateRow})`);
        });
    }
}

checkDuplicates();
