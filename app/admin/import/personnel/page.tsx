"use client";

import { useState, useRef, useCallback } from "react";
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
    email?: string;
}

export default function PersonnelImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ImportRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [dragActive, setDragActive] = useState(false);
    const [skippedCount, setSkippedCount] = useState(0);
    const [duplicateCount, setDuplicateCount] = useState(0);
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>("");
    const [workbookRef, setWorkbookRef] = useState<XLSX.WorkBook | null>(null);
    const [parseError, setParseError] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const downloadTemplate = () => {
        const template = [
            {
                "Sicil No": "35495",
                "Adı Soyadı ": "AHMET YILMAZ",
                "Tc Kimlik No": "12345678901",
                "Görevi": "Güvenlik Görevlisi",
                "Proje Adi": "TAV ESB",
                "Calisma Grubu": "HVS",
                "Personel Durumu": "Çalışan",
                "Cinsiyet": "ERKEK",
                "Telefon": "05551234567",
                "Email": "ahmet@tav.com",
                "Adres": "Ankara"
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Personeller");
        XLSX.writeFile(wb, "personel_import_sablonu.xlsx");
    };

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setResult(null);
        setSkippedCount(0);
        setDuplicateCount(0);
        setParseError("");
        setPreviewData([]);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                setWorkbookRef(workbook);

                if (workbook.SheetNames.length > 1) {
                    setSheetNames(workbook.SheetNames);
                    setSelectedSheet(workbook.SheetNames[0]);
                } else {
                    setSheetNames([]);
                    setSelectedSheet("");
                }

                parseSheet(workbook, workbook.SheetNames[0]);
            } catch (err: any) {
                console.error("Excel parse hatası:", err);
                setParseError(`Dosya okunamadı: ${err?.message || "Bilinmeyen hata"}`);
                setPreviewData([]);
            }
        };
        reader.onerror = () => {
            setParseError("Dosya okunurken bir hata oluştu.");
            setPreviewData([]);
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) handleFileSelect(selectedFile);
    };

    const handleSheetChange = (sheetName: string) => {
        setSelectedSheet(sheetName);
        if (workbookRef) parseSheet(workbookRef, sheetName);
    };

    const parseSheet = (workbook: XLSX.WorkBook, sheetName: string) => {
        try {
            setParseError("");
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

            if (!jsonData || jsonData.length === 0) {
                setParseError("Seçilen sayfada veri bulunamadı.");
                setPreviewData([]);
                return;
            }

            const col = (row: any, ...keys: string[]): string => {
                const rowLower: Record<string, any> = {};
                for (const k of Object.keys(row)) rowLower[k.toLowerCase().trim()] = row[k];
                for (const key of keys) {
                    const val = row[key] ?? rowLower[key.toLowerCase().trim()];
                    if (val !== undefined && val !== null && String(val).trim() !== "") return String(val).trim();
                }
                return "";
            };

            const mapDurum = (val: string): string => {
                const s = val.toLowerCase();
                if (s.includes("ayrıl") || s.includes("ayril")) return "AYRILDI";
                if (s.includes("izin")) return "IZINLI";
                if (s.includes("pasif") || s.includes("inaktif")) return "PASIF";
                return "CALISAN";
            };

            const mapped: ImportRow[] = jsonData.map((row: any) => {
                const durum = col(row, "Personel Durumu", "personel durumu", "PERSONEL DURUMU", "Durum", "durum", "personelDurumu");
                return {
                    sicilNo: col(row, "Sicil No", "sicil no", "SICIL NO", "sicilNo", "SicilNo"),
                    fullName: col(row, "Adı Soyadı", "adı soyadi", "adi soyadi", "Ad Soyad", "ad soyad", "AD SOYAD", "fullName", "AdSoyad"),
                    tcKimlikNo: col(row, "Tc Kimlik No", "tc kimlik no", "TC Kimlik", "tc kimlik", "tcKimlikNo", "TC No") || undefined,
                    gorevi: col(row, "Görevi", "gorevi", "görev", "gorev") || undefined,
                    projeAdi: col(row, "Proje Adi", "proje adi", "Proje Adı", "Proje", "proje", "projeAdi") || undefined,
                    grup: col(row, "Calisma Grubu", "çalışma grubu", "calisma grubu", "Grup", "grup") || undefined,
                    personelDurumu: durum ? mapDurum(durum) : undefined,
                    cinsiyet: col(row, "Cinsiyet", "cinsiyet") || undefined,
                    telefon: col(row, "Telefon", "telefon") || undefined,
                    dogumTarihi: col(row, "Doğum Tarihi", "dogum tarihi", "dogumTarihi") || undefined,
                    adres: col(row, "Adres", "adres") || undefined,
                    email: col(row, "Email", "email", "E-posta", "e-posta", "E-Mail") || undefined,
                };
            });

            // Geçersiz satırları say
            let invalidCount = 0;
            let dupCount = 0;
            const seen = new Set<string>();
            const unique = mapped.filter(r => {
                if (!r.sicilNo || !r.fullName) {
                    invalidCount++;
                    return false;
                }
                if (seen.has(r.sicilNo)) {
                    dupCount++;
                    return false;
                }
                seen.add(r.sicilNo);
                return true;
            });

            setSkippedCount(invalidCount);
            setDuplicateCount(dupCount);
            setPreviewData(unique);

            if (unique.length === 0 && mapped.length > 0) {
                const colNames = Object.keys(jsonData[0]).join(", ");
                setParseError(
                    `${mapped.length} satır okundu ancak geçerli kayıt bulunamadı. ` +
                    `Sicil No ve Ad Soyad sütunları gereklidir. ` +
                    `Dosyadaki sütunlar: ${colNames}`
                );
            }
        } catch (err: any) {
            console.error("Excel parse hatası:", err);
            setParseError(`Parse hatası: ${err?.message || "Bilinmeyen hata"}`);
            setPreviewData([]);
        }
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

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls") || droppedFile.name.endsWith(".csv"))) {
            handleFileSelect(droppedFile);
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
                {/* Drag & Drop Area */}
                <div
                    className={`mb-4 border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                        dragActive
                            ? "border-blue-500 bg-blue-50"
                            : file
                                ? "border-blue-300 bg-blue-50/50"
                                : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {file ? (
                        <div className="flex items-center justify-center gap-3">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-left">
                                <p className="font-medium text-gray-800">{file.name}</p>
                                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB - Değiştirmek için tıklayın</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-gray-600 font-medium">Dosyayı buraya sürükleyin veya tıklayın</p>
                            <p className="text-sm text-gray-400 mt-1">.xlsx, .xls veya .csv dosyaları desteklenir</p>
                        </>
                    )}
                </div>

                {/* Sheet Selection */}
                {sheetNames.length > 1 && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <label className="block text-sm font-medium text-amber-800 mb-2">
                            Birden fazla sayfa bulundu. Lütfen bir sayfa seçin:
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {sheetNames.map((name) => (
                                <button
                                    key={name}
                                    onClick={() => handleSheetChange(name)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        selectedSheet === name
                                            ? "bg-blue-600 text-white"
                                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Parse Error */}
                {parseError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-red-800">{parseError}</span>
                    </div>
                )}

                {/* Skipped / Duplicate Warnings */}
                {(skippedCount > 0 || duplicateCount > 0) && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                        {skippedCount > 0 && (
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="text-sm text-amber-800">
                                    {skippedCount} satır eksik veri (Sicil No veya Ad Soyad) nedeniyle atlandı
                                </span>
                            </div>
                        )}
                        {duplicateCount > 0 && (
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-amber-800">
                                    {duplicateCount} tekrarlanan sicil no birleştirildi
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <h3 className="font-semibold text-blue-800 mb-2">Excel Sütun Formatı</h3>
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
                                <li><code className="bg-white px-1 rounded">Email</code>, <code className="bg-white px-1 rounded">Telefon</code>, <code className="bg-white px-1 rounded">Adres</code></li>
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
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Sicil No</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Ad Soyad</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Görevi</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Grup</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Email</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {previewData.slice(0, 20).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                    {row.sicilNo}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 font-medium text-gray-800">{row.fullName}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.gorevi || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.grup || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500 text-xs">{row.email || "-"}</td>
                                            <td className="px-3 py-2">
                                                {row.personelDurumu && (
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        row.personelDurumu === "CALISAN" ? "bg-green-100 text-green-700" :
                                                        row.personelDurumu === "AYRILDI" ? "bg-red-100 text-red-700" :
                                                        row.personelDurumu === "IZINLI" ? "bg-yellow-100 text-yellow-700" :
                                                        "bg-gray-100 text-gray-600"
                                                    }`}>
                                                        {row.personelDurumu}
                                                    </span>
                                                )}
                                            </td>
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
                            Veriler sunucuya gönderiliyor...
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
                            {result.message}
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
                                    {result.data.errors.slice(0, 10).map((err: any, i: number) => (
                                        <li key={i}>Satır {err.row}: {err.message}</li>
                                    ))}
                                    {result.data.errors.length > 10 && (
                                        <li>...ve {result.data.errors.length - 10} hata daha</li>
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
