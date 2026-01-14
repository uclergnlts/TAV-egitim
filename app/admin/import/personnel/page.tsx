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

            // Map Excel columns to our fields
            const mapped: ImportRow[] = jsonData.map((row: any) => ({
                sicilNo: row["Sicil No"] || row["sicilNo"] || row["SicilNo"],
                fullName: row["Ad Soyad"] || row["fullName"] || row["AdSoyad"],
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
            <h1 className="text-2xl font-bold text-gray-800">Personel Import (Excel/CSV)</h1>

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

                <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <strong>Gerekli Sütunlar:</strong> Sicil No, Ad Soyad<br />
                    <strong>Opsiyonel:</strong> TC Kimlik, Görevi, Proje, Grup, Durum, Cinsiyet, Telefon, Doğum Tarihi, Adres
                </div>

                {previewData.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Önizleme ({previewData.length} kayıt)</h3>
                        <div className="max-h-64 overflow-auto border rounded">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Sicil No</th>
                                        <th className="px-4 py-2 text-left">Ad Soyad</th>
                                        <th className="px-4 py-2 text-left">Görevi</th>
                                        <th className="px-4 py-2 text-left">Grup</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {previewData.slice(0, 10).map((row, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2">{row.sicilNo}</td>
                                            <td className="px-4 py-2">{row.fullName}</td>
                                            <td className="px-4 py-2">{row.gorevi || "-"}</td>
                                            <td className="px-4 py-2">{row.grup || "-"}</td>
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
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "İşleniyor..." : `${previewData.length} Kaydı İçeri Aktar`}
                </button>

                {result && (
                    <div className={`mt-4 p-4 rounded-lg ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                        <p className="font-semibold">{result.message}</p>
                        {result.data && (
                            <ul className="text-sm mt-2">
                                <li>Yeni Oluşturulan: {result.data.created}</li>
                                <li>Güncellenen: {result.data.updated}</li>
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
