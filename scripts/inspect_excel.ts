
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const filePath = path.join(process.cwd(), 'doc', 'Personeller.xlsx');

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

if (data.length === 0) {
    console.log("Empty Excel file");
} else {
    console.log("Headers:", data[0]);
    console.log("First Row:", data.length > 1 ? data[1] : "No data");
}
