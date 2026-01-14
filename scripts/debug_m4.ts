
import * as XLSX from 'xlsx';
import path from 'path';

const filePath = path.join(process.cwd(), 'doc', 'eĞİTİMLER.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

const fs = require('fs');
const rows = data.slice(0, 30);
fs.writeFileSync('debug_output.json', JSON.stringify(rows, null, 2));
console.log("Written to debug_output.json");

