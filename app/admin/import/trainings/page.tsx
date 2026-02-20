"use client";

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

interface ImportRow {
    code: string;
    name: string;
    duration_min: number;
    category: string;
    default_location?: string;
    default_document_type?: string;
    topics?: string;
}

export default function TrainingsImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ImportRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [dragActive, setDragActive] = useState(false);
    const [skippedCount, setSkippedCount] = useState(0);
    const [formatInfo, setFormatInfo] = useState<string>("");
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>("");
    const [workbookRef, setWorkbookRef] = useState<XLSX.WorkBook | null>(null);
    const [parseError, setParseError] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setResult(null);
        setFormatInfo("");
        setSkippedCount(0);
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

            // Ham satır dizisi olarak oku (Yıllık Pivot: header 4. satırda)
            const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: null });

            // Header satırını bul: "EĞİTİM KODU" veya benzeri içeren satır
            let headerIdx = -1;
            let nameCol = -1, codeCol = -1, durCol = -1;

            // Pivot format algılama: İlk 20 satırda header ara
            const headerPattern = /e[gğ][iı]t[iı]m/i;
            const codePattern = /e[gğ][iı]t[iı]m\s*kodu/i;
            const durPattern = /dak[iı]ka|saat/i;

            for (let i = 0; i < Math.min(20, rawRows.length); i++) {
                const row = rawRows[i] as any[];
                if (!row) continue;

                let foundName = -1, foundCode = -1, foundDur = -1;

                for (let j = 0; j < row.length; j++) {
                    const v = String(row[j] ?? "").trim();
                    if (!v) continue;
                    const vUp = v.toUpperCase();

                    if (codePattern.test(v)) {
                        foundCode = j;
                    } else if (headerPattern.test(v) && !codePattern.test(v) && !durPattern.test(v) && !vUp.includes("YER")) {
                        foundName = j;
                    }
                    if (durPattern.test(v) || (vUp.includes("EĞT") && vUp.includes("SAAT"))) {
                        foundDur = j;
                    }
                }

                if (foundName >= 0 && foundCode >= 0) {
                    headerIdx = i;
                    nameCol = foundName;
                    codeCol = foundCode;
                    durCol = foundDur;
                    break;
                }
            }

            let mapped: ImportRow[] = [];

            if (headerIdx >= 0 && nameCol >= 0 && codeCol >= 0) {
                // Yıllık Pivot formatı
                setFormatInfo("Yıllık Pivot formatı algılandı");

                for (let i = headerIdx + 1; i < rawRows.length; i++) {
                    const row = rawRows[i] as any[];
                    if (!row) continue;
                    const name = String(row[nameCol] ?? "").trim();
                    const code = String(row[codeCol] ?? "").trim();
                    const durRaw = durCol >= 0 ? row[durCol] : null;
                    const dur = durRaw !== null ? parseInt(String(durRaw), 10) : NaN;

                    if (!name || !code) continue;
                    if (name.toUpperCase().includes("TOPLAM")) continue;

                    mapped.push({
                        code,
                        name,
                        duration_min: isNaN(dur) ? 60 : dur,
                        category: "TEMEL",
                        topics: "",
                    });
                }
            } else {
                // Standart format (ilk satır header)
                setFormatInfo("Standart format algılandı");

                const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
                const col = (row: any, ...keys: string[]): string => {
                    const rowLower: Record<string, any> = {};
                    for (const k of Object.keys(row)) rowLower[k.toLowerCase().trim()] = row[k];
                    for (const key of keys) {
                        const val = row[key] ?? rowLower[key.toLowerCase().trim()];
                        if (val !== undefined && val !== null && String(val).trim() !== "") return String(val).trim();
                    }
                    return "";
                };
                mapped = jsonData.map((row: any) => ({
                    code: col(row, "Kod", "kod", "code", "Eğitim Kodu", "egitim kodu"),
                    name: col(row, "Ad", "ad", "name", "Eğitim Adı", "egitim adi"),
                    duration_min: parseInt(col(row, "Süre", "Süre (dk)", "duration_min", "sure") || "60", 10),
                    category: (col(row, "Kategori", "category") || "TEMEL").toUpperCase(),
                    default_location: col(row, "Yer", "Eğitim Yeri", "default_location") || undefined,
                    default_document_type: col(row, "Belge Türü", "default_document_type") || undefined,
                    topics: col(row, "Alt Başlıklar", "topics", "Alt Konular"),
                }));
            }

            const valid = mapped.filter(r => r.code && r.name);
            setSkippedCount(mapped.length - valid.length);
            setPreviewData(valid);

            if (valid.length === 0) {
                setParseError(
                    "Geçerli eğitim kaydı bulunamadı. " +
                    "Eğitim Kodu ve Eğitim Adı sütunları gereklidir. " +
                    "Yıllık Pivot veya standart format desteklenir."
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
            const res = await fetch("/api/import/trainings", {
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

    const downloadTemplate = () => {
        const wb = XLSX.utils.book_new();
        const aoa = [
            [],
            [null, "TAV ÖZEL GÜVENLİK HİZMETLERİ A.Ş. EĞİTİM YILI EĞİTİM TÜRLERİ"],
            [],
            [null, "EĞİTİMLER", "EĞİTİM KODU ", "EĞT. SAATi DAKİKA", "OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN", "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK"],
            [null, "BİLGİ TAZELEME EĞİTİMİ", "M4", 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [null, "KARGO POSTA GÜVENLİĞİ", "M11", 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [null, "YENİ EĞİTİM ADI", "M99", 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, "Sayfa1");
        XLSX.writeFile(wb, "egitim_import_sablonu.xlsx");
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
                    <h1 className="text-2xl font-bold text-gray-800">Eğitim Import (Excel)</h1>
                    <p className="text-gray-500 text-sm mt-1">Excel dosyasından toplu eğitim ve alt başlık yükleyin</p>
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
                            ? "border-purple-500 bg-purple-50"
                            : file
                                ? "border-purple-300 bg-purple-50/50"
                                : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/30"
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
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                            ? "bg-purple-600 text-white"
                                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Format Info */}
                {formatInfo && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-purple-800">{formatInfo}</span>
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

                {/* Skipped Rows Warning */}
                {skippedCount > 0 && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-sm text-amber-800">
                            {skippedCount} satır eksik veri (Kod veya Ad) nedeniyle atlandı
                        </span>
                    </div>
                )}

                <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg border border-purple-100">
                    <h3 className="font-semibold text-purple-800 mb-2">Excel Sütun Formatı</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-gray-700">Zorunlu Alanlar:</p>
                            <ul className="list-disc list-inside text-gray-600 ml-2">
                                <li><code className="bg-white px-1 rounded">Kod</code> - Eğitim kodu (Örn: M90)</li>
                                <li><code className="bg-white px-1 rounded">Ad</code> - Eğitim adı</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-medium text-gray-700">Opsiyonel Alanlar:</p>
                            <ul className="list-disc list-inside text-gray-600 ml-2">
                                <li><code className="bg-white px-1 rounded">Süre (dk)</code> - Dakika (varsayılan: 60)</li>
                                <li><code className="bg-white px-1 rounded">Kategori</code> - TEMEL, TAZELEME, DIGER</li>
                                <li><code className="bg-white px-1 rounded">Alt Başlıklar</code> - Virgülle ayrılmış</li>
                            </ul>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Alt başlıkları virgülle ayırarak tek hücreye yazın. Örn: "Giriş, Temel Kavramlar, Sonuç"
                    </p>
                </div>

                {previewData.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm">
                                {previewData.length}
                            </span>
                            Önizleme
                        </h3>
                        <div className="max-h-80 overflow-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Kod</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Ad</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Süre</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Kategori</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Alt Başlıklar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {previewData.slice(0, 20).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                    {row.code}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 font-medium text-gray-800">{row.name}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.duration_min} dk</td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    row.category === "TEMEL" ? "bg-purple-100 text-purple-700" :
                                                    row.category === "TAZELEME" ? "bg-amber-100 text-amber-700" :
                                                    "bg-gray-100 text-gray-600"
                                                }`}>
                                                    {row.category}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-500 text-xs max-w-xs truncate">
                                                {row.topics || "-"}
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
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center justify-center gap-2"
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
                            {previewData.length} Eğitimi İçeri Aktar
                        </>
                    )}
                </button>

                {result && (
                    <div className={`mt-4 p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        <p className={`font-semibold ${result.success ? "text-green-800" : "text-red-800"}`}>
                            {result.message}
                        </p>
                        {result.data && (
                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                                <div className="bg-white p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-600">{result.data.created}</p>
                                    <p className="text-gray-500">Yeni Oluşturulan</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-purple-600">{result.data.updated}</p>
                                    <p className="text-gray-500">Güncellenen</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-fuchsia-600">{result.data.topicsCreated}</p>
                                    <p className="text-gray-500">Alt Başlık</p>
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
