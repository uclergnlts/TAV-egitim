/**
 * Excel dosyasını JSON'a export scripti
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Dizindeki tüm xlsx dosyalarını bul
const rootDir = path.join(__dirname, '..');
const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.xlsx'));
console.log('Bulunan xlsx dosyaları:', files);

const filePath = path.join(rootDir, files[0]);
console.log('Dosya yolu:', filePath);

try {
    const workbook = XLSX.readFile(filePath);
    const result = {};

    // Her sheet için
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Boş olmayan satırları filtrele
        const nonEmptyRows = data.filter(row => row && row.some(cell => cell != null && cell !== ''));

        if (nonEmptyRows.length > 0) {
            const headers = nonEmptyRows[0];
            const rows = nonEmptyRows.slice(1).map(row => {
                const obj = {};
                headers.forEach((h, i) => {
                    if (h != null && row[i] != null) {
                        obj[h] = row[i];
                    }
                });
                return obj;
            });

            result[sheetName] = {
                headers: headers.filter(h => h != null && h !== ''),
                rowCount: rows.length,
                data: rows
            };
        }
    });

    // JSON dosyasına yaz
    const outputPath = path.join(rootDir, 'excel-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
    console.log('\n✅ Veriler export edildi:', outputPath);

    // Özet göster
    Object.keys(result).forEach(sheet => {
        console.log(`\nSheet: ${sheet}`);
        console.log(`  Headers: ${result[sheet].headers.join(', ')}`);
        console.log(`  Rows: ${result[sheet].rowCount}`);
    });

} catch (error) {
    console.error('Hata:', error.message);
}
