"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface ImportRow {
    sicilNo: string;
    egitimKodu: string;
    baslamaTarihi: string;
    bitisTarihi?: string;
    baslamaSaati?: string;
    bitisSaati?: string;
    egitimYeri?: string;
    icDisEgitim?: string;
    sonucBelgesiTuru?: string;
    egitmenSicil?: string;
}

export default function AttendanceImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ImportRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = async (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

            // Map Excel columns
            const mapped: ImportRow[] = jsonData.map((row: any) => ({
                sicilNo: row["Sicil No"] || row["sicilNo"] || row["SicilNo"],
                egitimKodu: row["Eğitim Kodu"] || row["egitimKodu"] || row["EgitimKodu"],
                baslamaTarihi: formatDate(row["Başlama Tarihi"] || row["baslamaTarihi"]),
                bitisTarihi: formatDate(row["Bitiş Tarihi"] || row["bitisTarihi"]),
                baslamaSaati: row["Başlama Saati"] || row["baslamaSaati"],
                bitisSaati: row["Bitiş Saati"] || row["bitisSaati"],
                egitimYeri: row["Eğitim Yeri"] || row["egitimYeri"],
                icDisEgitim: row["İç/Dış"] || row["icDisEgitim"],
                sonucBelgesiTuru: row["Belge Türü"] || row["sonucBelgesiTuru"],
                egitmenSicil: row["Eğitmen Sicil"] || row["egitmenSicil"],
            }));

            setPreviewData(mapped.filter(r => r.sicilNo && r.egitimKodu && r.baslamaTarihi));
        };
        reader.readAsArrayBuffer(file);
    };

    const formatDate = (val: any): string => {
        if (!val) return "";
        if (typeof val === "number") {
            // Excel serial date
            const date = XLSX.SSF.parse_date_code(val);
            return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
        }
        return String(val);
    };

    const handleImport = async () => {
        if (previewData.length === 0) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/import/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: previewData })
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setResult({ success: false, message: "Bağlantı hatası" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Katılım Import (Excel/CSV)</h1>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Excel Dosyası Seçin (.xlsx, .csv)
                    </label>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <strong>Gerekli Sütunlar:</strong> Sicil No, Eğitim Kodu, Başlama Tarihi<br />
                    <strong>Opsiyonel:</strong> Bitiş Tarihi, Saatler, Eğitim Yeri, İç/Dış, Belge Türü, Eğitmen Sicil
                </div>

                {previewData.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Önizleme ({previewData.length} kayıt)</h3>
                        <div className="max-h-64 overflow-auto border rounded">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Sicil No</th>
                                        <th className="px-4 py-2 text-left">Eğitim Kodu</th>
                                        <th className="px-4 py-2 text-left">Başlama Tarihi</th>
                                        <th className="px-4 py-2 text-left">Eğitim Yeri</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {previewData.slice(0, 10).map((row, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2">{row.sicilNo}</td>
                                            <td className="px-4 py-2">{row.egitimKodu}</td>
                                            <td className="px-4 py-2">{row.baslamaTarihi}</td>
                                            <td className="px-4 py-2">{row.egitimYeri || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {previewData.length > 10 && (
                            <p className="text-xs text-gray-500 mt-1">...ve {previewData.length - 10} kayıt daha</p>
                        )}
                    </div>
                )}

                <button
                    onClick={handleImport}
                    disabled={loading || previewData.length === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "İşleniyor..." : `${previewData.length} Kaydı İçeri Aktar`}
                </button>

                {result && (
                    <div className={`mt-4 p-4 rounded-lg ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                        <p className="font-semibold">{result.message}</p>
                        {result.data && (
                            <ul className="text-sm mt-2">
                                <li>Oluşturulan: {result.data.created}</li>
                                <li>Atlanan (Duplicate): {result.data.skipped}</li>
                                {result.data.errors?.length > 0 && (
                                    <li className="text-red-600">Hatalar: {result.data.errors.length}</li>
                                )}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
