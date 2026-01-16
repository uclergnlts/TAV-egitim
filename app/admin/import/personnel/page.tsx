"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface ImportRow {
    sicilNo: string;
    fullName: string;
    tcKimlikNo?: string;
    gorevi?: string;
    projeAdi?: string;
    grup?: string;
    personelDurumu?: string;
    cinsiyet?: string;
    telefon?: string;
    dogumTarihi?: string;
    adres?: string;
}

export default function PersonnelImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ImportRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const downloadTemplate = () => {
        const template = [
            {
                "Sicil No": "12345",
                "Ad Soyad": "Ahmet Yılmaz",
                "TC Kimlik": "12345678901",
                "Görevi": "Teknisyen",
                "Proje": "TAV İstanbul",
                "Grup": "A Grubu",
                "Durum": "CALISAN",
                "Cinsiyet": "ERKEK",
                "Telefon": "05551234567",
                "Doğum Tarihi": "1990-01-15",
                "Adres": "İstanbul"
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Personeller");
        XLSX.writeFile(wb, "personel_import_sablonu.xlsx");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
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

            // Map Excel columns to our fields
            const mapped: ImportRow[] = jsonData.map((row: any) => ({
                sicilNo: String(row["Sicil No"] || row["sicilNo"] || row["SicilNo"] || "").trim(),
                fullName: String(row["Ad Soyad"] || row["fullName"] || row["AdSoyad"] || "").trim(),
                tcKimlikNo: row["TC Kimlik"] || row["tcKimlikNo"],
                gorevi: row["Görevi"] || row["gorevi"],
                projeAdi: row["Proje"] || row["projeAdi"],
                grup: row["Grup"] || row["grup"],
                personelDurumu: row["Durum"] || row["personelDurumu"],
                cinsiyet: row["Cinsiyet"] || row["cinsiyet"],
                telefon: row["Telefon"] || row["telefon"],
                dogumTarihi: row["Doğum Tarihi"] || row["dogumTarihi"],
                adres: row["Adres"] || row["adres"],
            }));

            setPreviewData(mapped.filter(r => r.sicilNo && r.fullName));
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        if (previewData.length === 0) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/import/personnel", {
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Personel Import (Excel)</h1>
                    <p className="text-gray-500 text-sm mt-1">Excel dosyasından toplu personel yükleyin</p>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Şablon İndir
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Excel Dosyası Seçin (.xlsx, .csv)
                    </label>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <h3 className="font-semibold text-blue-800 mb-2">📋 Excel Sütun Formatı</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-gray-700">Zorunlu Alanlar:</p>
                            <ul className="list-disc list-inside text-gray-600 ml-2">
                                <li><code className="bg-white px-1 rounded">Sicil No</code></li>
                                <li><code className="bg-white px-1 rounded">Ad Soyad</code></li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-medium text-gray-700">Opsiyonel Alanlar:</p>
                            <ul className="list-disc list-inside text-gray-600 ml-2">
                                <li><code className="bg-white px-1 rounded">TC Kimlik</code>, <code className="bg-white px-1 rounded">Görevi</code></li>
                                <li><code className="bg-white px-1 rounded">Proje</code>, <code className="bg-white px-1 rounded">Grup</code>, <code className="bg-white px-1 rounded">Durum</code></li>
                                <li><code className="bg-white px-1 rounded">Cinsiyet</code>, <code className="bg-white px-1 rounded">Telefon</code>, <code className="bg-white px-1 rounded">Adres</code></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {previewData.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm">
                                {previewData.length}
                            </span>
                            Önizleme
                        </h3>
                        <div className="max-h-80 overflow-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Sicil No</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Ad Soyad</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Görevi</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Grup</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {previewData.slice(0, 20).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">
                                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                    {row.sicilNo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 font-medium text-gray-800">{row.fullName}</td>
                                            <td className="px-4 py-2 text-gray-600">{row.gorevi || "-"}</td>
                                            <td className="px-4 py-2 text-gray-500">{row.grup || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {previewData.length > 20 && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                ...ve {previewData.length - 20} kayıt daha
                            </p>
                        )}
                    </div>
                )}

                <button
                    onClick={handleImport}
                    disabled={loading || previewData.length === 0}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            İşleniyor...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {previewData.length} Personeli İçeri Aktar
                        </>
                    )}
                </button>

                {result && (
                    <div className={`mt-4 p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        <p className={`font-semibold ${result.success ? "text-green-800" : "text-red-800"}`}>
                            {result.success ? "✅ " : "❌ "}{result.message}
                        </p>
                        {result.data && (
                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-white p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-600">{result.data.created}</p>
                                    <p className="text-gray-500">Yeni Oluşturulan</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-blue-600">{result.data.updated}</p>
                                    <p className="text-gray-500">Güncellenen</p>
                                </div>
                            </div>
                        )}
                        {result.data?.errors?.length > 0 && (
                            <div className="mt-3 p-3 bg-red-100 rounded-lg">
                                <p className="font-medium text-red-700 mb-1">Hatalar:</p>
                                <ul className="text-sm text-red-600 list-disc list-inside">
                                    {result.data.errors.slice(0, 5).map((err: any, i: number) => (
                                        <li key={i}>Satır {err.row}: {err.message}</li>
                                    ))}
                                    {result.data.errors.length > 5 && (
                                        <li>...ve {result.data.errors.length - 5} hata daha</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
