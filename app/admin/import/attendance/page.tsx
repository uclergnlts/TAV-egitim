"use client";

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

interface ImportRow {
    sicilNo: string;
    adiSoyadi?: string;
    tcKimlikNo?: string;
    gorevi?: string;
    projeAdi?: string;
    calismaGrubu?: string;
    egitimKodu: string;
    egitimKoduYeni?: string;
    baslamaTarihi: string;
    bitisTarihi?: string;
    egitimSuresi?: string;
    baslamaSaati?: string;
    bitisSaati?: string;
    egitimYeri?: string;
    icDisEgitim?: string;
    sonucBelgesiTuru?: string;
    egitmenSicil?: string;
    yerlesim?: string;
    organizasyon?: string;
    sirketAdi?: string;
    vardiyaTipi?: string;
    terminal?: string;
    bolgeKodu?: string;
    egitimDetayAciklama?: string;
    egitimDetayAciklamaYeni?: string;
    egitimTestSonucu?: string;
    tazelemePlanlamaTarihi?: string;
    veriyiGirenSicil?: string;
    veriGirisTarihi?: string;
    personelDurumu?: "CALISAN" | "AYRILDI" | "IZINLI" | "PASIF";
}

export default function AttendanceImportPage() {
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

    const downloadTemplate = () => {
        const template = [
            {
                "S. No": 1,
                "Sicil No": "35495",
                "Adı Soyadı ": "AHMET YILMAZ",
                "Tc Kimlik No": "12345678901",
                "Yerlesim": "TAV Esenboğa",
                "Organizasyon": "TAV Güvenlik",
                "Şirket Adı": "TAV Ankara",
                "Görevi": "Güvenlik Görevlisi",
                "Vardiya Tipi": "",
                "Proje Adi": "TAV ESB",
                "Calisma Grubu": "HVS",
                "Terminal": "Kargo",
                "Bolge Kodu": "110",
                "Egitim Kodu": "",
                "Egitim Kodu (Yeni)": "M4",
                "Egt Bas Trh": "06.04.2024",
                "Egt Bit Trh": "06.04.2024",
                "Egitim Suresi": 40,
                "Egitim Baslama Saati": "09:00",
                "Egitim Bitis Saati": "17:00",
                "Egitimin Yeri": "Cihaz Başı",
                "Eğitmen Adı": "35200 Adil Kaya",
                "Sonuc Belgesi": "Eğitim Katılım Çizelgesi",
                "Ic Dis Egitim": "Hizmet İçi",
                "Egitim Detay Aciklama": "",
                "Egitim Detay Açıklama (Yeni)": "Kabin ve Uçakaltı",
                "Personel Durumu": "Çalışan"
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Detaylı Liste");
        XLSX.writeFile(wb, "katilim_import_sablonu.xlsx");
    };

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

    // Excel serial number → YYYY-MM-DD (manuel hesaplama)
    const excelSerialToDate = (serial: number): string => {
        // Excel epoch: 1 Ocak 1900 = serial 1
        // Excel'in 29 Şubat 1900 hatası: serial > 60 ise 1 gün çıkar
        const adjusted = serial > 60 ? serial - 1 : serial;
        // 1 Ocak 1900 = JS'de new Date(1900,0,1)
        const baseDate = new Date(1900, 0, 1);
        const date = new Date(baseDate.getTime() + (adjusted - 1) * 86400000);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    // DD.MM.YYYY veya Excel serial → YYYY-MM-DD
    const parseTurkishDate = (val: any): string => {
        if (!val && val !== 0) return "";

        // Date objesi
        if (val instanceof Date) {
            const y = val.getFullYear();
            const m = String(val.getMonth() + 1).padStart(2, "0");
            const d = String(val.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
        }

        // Excel serial date numarası (genellikle 1-200000 arası)
        if (typeof val === "number" && val > 0 && val < 200000) {
            return excelSerialToDate(val);
        }

        const s = String(val).trim();

        // DD.MM.YYYY
        const m1 = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (m1) {
            let day = parseInt(m1[1]);
            let month = parseInt(m1[2]);
            let year = parseInt(m1[3]);

            // Handle corrupted year format (e.g., 6024 -> 2024, 6025 -> 2025)
            if (year >= 6000 && year <= 6999) {
                year = year - 4000; // 6024 -> 2024, 6025 -> 2025
            }

            // Handle invalid day (0 or > 31)
            if (day === 0 || day > 31) {
                day = 1; // Default to 1st of month
            }

            // Handle invalid month (0 or > 12)
            if (month === 0 || month > 12) {
                month = 1; // Default to January
            }

            const d = String(day).padStart(2, "0");
            const m = String(month).padStart(2, "0");
            const y = String(year);
            return `${y}-${m}-${d}`;
        }

        // DD/MM/YYYY
        const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m2) {
            let day = parseInt(m2[1]);
            let month = parseInt(m2[2]);
            let year = parseInt(m2[3]);

            // Handle corrupted year format
            if (year >= 6000 && year <= 6999) {
                year = year - 4000;
            }

            // Handle invalid day
            if (day === 0 || day > 31) {
                day = 1;
            }

            // Handle invalid month
            if (month === 0 || month > 12) {
                month = 1;
            }

            const d = String(day).padStart(2, "0");
            const m = String(month).padStart(2, "0");
            const y = String(year);
            return `${y}-${m}-${d}`;
        }

        // YYYY-MM-DD (zaten doğru format)
        if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;

        return "";
    };

    const parseExcelTime = (val: any, fallback = "09:00"): string => {
        if (!val && val !== 0) return fallback;

        // Date objesi
        if (val instanceof Date) {
            const h = String(val.getHours()).padStart(2, "0");
            const m = String(val.getMinutes()).padStart(2, "0");
            return `${h}:${m}`;
        }

        // Excel time fraction (0-1 arası: 0=00:00, 0.5=12:00, 1=24:00)
        if (typeof val === "number" && val >= 0 && val < 1) {
            const totalMin = Math.round(val * 24 * 60);
            const h = Math.floor(totalMin / 60) % 24;
            const m = totalMin % 60;
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }

        // Eğer büyük sayı ise (Excel date+time birleşik), sadece zaman kısmını al
        if (typeof val === "number" && val >= 1) {
            const timeFraction = val - Math.floor(val);
            const totalMin = Math.round(timeFraction * 24 * 60);
            const h = Math.floor(totalMin / 60) % 24;
            const m = totalMin % 60;
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }

        const s = String(val).trim();
        if (s.match(/^\d{1,2}:\d{2}/)) return s.substring(0, 5);
        return fallback;
    };

    const mapIcDis = (val: any): string => {
        const s = String(val ?? "").toLowerCase();
        if (s.includes("dış") || s.includes("dis") || s === "d" || s.includes("harici")) return "DIS";
        return "IC";
    };

    const mapSonuc = (val: any): string => {
        const s = String(val ?? "").toLowerCase();
        if (s.includes("sertifika")) return "SERTIFIKA";
        return "EGITIM_KATILIM_CIZELGESI";
    };

    const extractEgitmenSicil = (val: any): string => {
        if (!val) return "";
        const m = String(val).trim().match(/^(\d+)/);
        return m ? m[1] : "";
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

            // Detaylı Liste formatı algılama
            const firstRow = jsonData[0];
            const keys = Object.keys(firstRow).map(k => k.toLowerCase().trim());

            if (firstRow) {
                const hasDetayliCols = keys.some(k => k.includes("egt bas") || k.includes("egitim kodu"));
                setFormatInfo(hasDetayliCols ? "Detaylı Liste formatı algılandı" : "Standart format algılandı");
            }

            // Sütun eşleştirme yardımcısı
            const col = (row: any, ...searchKeys: string[]): any => {
                const rowLower: Record<string, any> = {};
                for (const k of Object.keys(row)) rowLower[k.toLowerCase().trim()] = row[k];
                for (const key of searchKeys) {
                    const val = row[key] ?? rowLower[key.toLowerCase().trim()];
                    if (val !== undefined && val !== null && String(val).trim() !== "") return val;
                }
                return undefined;
            };

            const mapped: ImportRow[] = jsonData.map((row: any) => ({
                sicilNo: String(col(row, "Sicil No", "sicil no", "sicilNo", "Sicil", "sicil") ?? "").trim(),
                adiSoyadi: String(col(row, "Adı Soyadı", "Adı Soyadı ", "Adi Soyadi", "ad soyad", "ad soyadı") ?? "").trim(),
                tcKimlikNo: String(col(row, "Tc Kimlik No", "TC Kimlik No", "tc kimlik no", "tcKimlikNo") ?? "").trim(),
                gorevi: String(col(row, "Görevi", "Gorevi", "görevi", "gorevi") ?? "").trim(),
                projeAdi: String(col(row, "Proje Adi", "Proje Adı", "proje adi", "proje adı", "projeAdi") ?? "").trim(),
                calismaGrubu: String(col(row, "Calisma Grubu", "Çalışma Grubu", "calisma grubu", "çalışma grubu", "grup") ?? "").trim(),
                egitimKodu: String(col(row,
                    "Egitim Kodu", "Eğitim Kodu", "egitimKodu",
                    "Egitim Kodu (Yeni)", "Eğitim Kodu (Yeni)",
                    "Eğitim Kodu", "egitim kodu") ?? "").trim(),
                egitimKoduYeni: String(col(row, "Egitim Kodu (Yeni)", "Eğitim Kodu (Yeni)") ?? "").trim(),
                baslamaTarihi: parseTurkishDate(col(row, "Egt Bas Trh", "Başlama Tarihi", "baslamaTarihi", "Baslama Tarihi", "baslama tarihi")),
                bitisTarihi: parseTurkishDate(col(row, "Egt Bit Trh", "Bitiş Tarihi", "bitisTarihi", "Bitis Tarihi")),
                egitimSuresi: String(col(row, "Egitim Suresi", "Eğitim Süresi") ?? "").trim(),
                baslamaSaati: parseExcelTime(col(row, "Egitim Baslama Saati", "Eğitim Başlama Saati", "Başlama Saati", "baslamaSaati"), "09:00"),
                bitisSaati: parseExcelTime(col(row, "Egitim Bitis Saati", "Eğitim Bitiş Saati", "Bitiş Saati", "bitisSaati"), "17:00"),
                egitimYeri: String(col(row, "Egitimin Yeri", "Eğitim Yeri", "egitimYeri") ?? ""),
                icDisEgitim: mapIcDis(col(row, "Ic Dis Egitim", "İç/Dış", "icDisEgitim", "Ic/Dis")),
                sonucBelgesiTuru: mapSonuc(col(row, "Sonuc Belgesi", "Belge Türü", "sonucBelgesiTuru")),
                egitmenSicil: extractEgitmenSicil(col(row, "Eğitmen Adı", "Egitmen Adi", "Eğitmen Sicil", "egitmenSicil")),
                yerlesim: String(col(row, "Yerlesim") ?? "").trim(),
                organizasyon: String(col(row, "Organizasyon") ?? "").trim(),
                sirketAdi: String(col(row, "Şirket Adı", "Sirket Adi") ?? "").trim(),
                vardiyaTipi: String(col(row, "Vardiya Tipi") ?? "").trim(),
                terminal: String(col(row, "Terminal") ?? "").trim(),
                bolgeKodu: String(col(row, "Bolge Kodu", "Bölge Kodu") ?? "").trim(),
                egitimDetayAciklama: String(col(row, "Egitim Detay Aciklama", "Eğitim Detay Açıklama") ?? "").trim(),
                egitimDetayAciklamaYeni: String(col(row, "Egitim Detay Açıklama (Yeni)", "Eğitim Detay Açıklama (Yeni)") ?? "").trim(),
                egitimTestSonucu: String(col(row, "Egitim Test Sonucu", "Eğitim Test Sonucu") ?? "").trim(),
                tazelemePlanlamaTarihi: parseTurkishDate(col(row, "Tazeleme Planlama Tarihi")),
                veriyiGirenSicil: String(col(row, "Veriyi Giren Sicil") ?? "").trim(),
                veriGirisTarihi: String(col(row, "Veri Giris Tarihi", "Veri Giriş Tarihi") ?? "").trim(),
                personelDurumu: String(col(row, "Personel Durumu") ?? "").toUpperCase().includes("AYR") ? "AYRILDI" :
                    String(col(row, "Personel Durumu") ?? "").toUpperCase().includes("IZIN") ? "IZINLI" :
                        String(col(row, "Personel Durumu") ?? "").toUpperCase().includes("PAS") ? "PASIF" : "CALISAN",
            }));

            const valid = mapped.filter(r => r.sicilNo && r.egitimKodu && r.baslamaTarihi);
            const skipped = mapped.length - valid.length;
            setSkippedCount(skipped);
            setPreviewData(valid);

            if (valid.length === 0 && mapped.length > 0) {
                const sampleRow = jsonData[0];
                const debugEntries: string[] = [];
                for (const key of Object.keys(sampleRow)) {
                    const v = sampleRow[key];
                    debugEntries.push(`"${key}": ${JSON.stringify(v)} (${typeof v})`);
                }
                setParseError(
                    `${mapped.length} satır okundu ancak geçerli kayıt bulunamadı. ` +
                    `Sicil No, Eğitim Kodu ve Başlama Tarihi sütunları gereklidir.\n` +
                    `İlk satır: ${debugEntries.join(", ")}`
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

    // Drag & Drop handlers
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
                    <h1 className="text-2xl font-bold text-gray-800">Katılım Import (Excel)</h1>
                    <p className="text-gray-500 text-sm mt-1">Excel dosyasından toplu katılım kaydı yükleyin</p>
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
                            ? "border-emerald-500 bg-emerald-50"
                            : file
                                ? "border-emerald-300 bg-emerald-50/50"
                                : "border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/30"
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
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                            ? "bg-emerald-600 text-white"
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
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-blue-800">{formatInfo}</span>
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
                            {skippedCount} satır eksik veri (Sicil No, Eğitim Kodu veya Başlama Tarihi) nedeniyle atlandı
                        </span>
                    </div>
                )}

                <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                    <h3 className="font-semibold text-emerald-800 mb-2">Excel Sütun Formatı</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-gray-700">Zorunlu Alanlar:</p>
                            <ul className="list-disc list-inside text-gray-600 ml-2">
                                <li><code className="bg-white px-1 rounded">Sicil No</code></li>
                                <li><code className="bg-white px-1 rounded">Egitim Kodu</code> veya <code className="bg-white px-1 rounded">Egitim Kodu (Yeni)</code></li>
                                <li><code className="bg-white px-1 rounded">Egt Bas Trh</code> / <code className="bg-white px-1 rounded">Başlama Tarihi</code></li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-medium text-gray-700">Varsayılanlar:</p>
                            <ul className="list-disc list-inside text-gray-600 ml-2">
                                <li><code className="bg-white px-1 rounded">Egt Bit Trh</code>: başlangıç tarihi</li>
                                <li><code className="bg-white px-1 rounded">Egitim Baslama Saati</code>: <code className="bg-white px-1 rounded">09:00</code></li>
                                <li><code className="bg-white px-1 rounded">Egitim Bitis Saati</code>: <code className="bg-white px-1 rounded">17:00</code></li>
                                <li><code className="bg-white px-1 rounded">Ic Dis Egitim</code>: <code className="bg-white px-1 rounded">IC</code></li>
                                <li><code className="bg-white px-1 rounded">Sonuc Belgesi</code>: <code className="bg-white px-1 rounded">EGITIM_KATILIM_CIZELGESI</code></li>
                                <li><code className="bg-white px-1 rounded">Personel Durumu</code>: <code className="bg-white px-1 rounded">CALISAN</code></li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-medium text-gray-700">Opsiyonel Alanlar:</p>
                            <ul className="list-disc list-inside text-gray-600 ml-2">
                                <li>Detaylı liste sütunları desteklenir (<code className="bg-white px-1 rounded">Yerlesim</code>, <code className="bg-white px-1 rounded">Organizasyon</code>, <code className="bg-white px-1 rounded">Şirket Adı</code>...)</li>
                                <li><code className="bg-white px-1 rounded">Eğitmen Adı</code>: baştaki sicil numarası alınır</li>
                                <li><code className="bg-white px-1 rounded">Veri Giris Tarihi</code> yoksa import anı kullanılır</li>
                                <li>Personel kaydı yoksa otomatik personel oluşturulur</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {previewData.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm">
                                {previewData.length}
                            </span>
                            Önizleme
                        </h3>
                        <div className="max-h-80 overflow-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-xs whitespace-nowrap">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">S. No</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Sicil No</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Adı Soyadı</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Tc Kimlik No</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Yerlesim</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Organizasyon</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Şirket Adı</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Görevi</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Vardiya Tipi</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Proje Adi</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Calisma Grubu</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Terminal</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Bolge Kodu</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Egitim Kodu</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Egitim Kodu (Yeni)</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Egt Bas Trh</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Egt Bit Trh</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Egitim Suresi</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Egitim Baslama Saati</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Egitim Bitis Saati</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Egitimin Yeri</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Eğitmen Adı</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Sonuc Belgesi</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Ic Dis Egitim</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Egitim Detay Aciklama</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Egitim Detay Açıklama (Yeni)</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Egitim Test Sonucu</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Tazeleme Planlama Tarihi</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Veriyi Giren Sicil</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Veri Giris Tarihi</th>
                                        <th className="px-3 py-3 text-left font-semibold text-gray-600">Personel Durumu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {previewData.slice(0, 20).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                                            <td className="px-3 py-2">
                                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                    {row.sicilNo}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-600">{row.adiSoyadi || "-"}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.tcKimlikNo || "-"}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.yerlesim || "-"}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.organizasyon || "-"}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.sirketAdi || "-"}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.gorevi || "-"}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.vardiyaTipi || "-"}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.projeAdi || "-"}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.calismaGrubu || "-"}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.terminal || "-"}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.bolgeKodu || "-"}</td>
                                            <td className="px-3 py-2">
                                                <span className="font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">
                                                    {row.egitimKodu || "-"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-600">{row.egitimKoduYeni || "-"}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.baslamaTarihi || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.bitisTarihi || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.egitimSuresi || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.baslamaSaati || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.bitisSaati || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.egitimYeri || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.egitmenSicil || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.sonucBelgesiTuru || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.icDisEgitim === "DIS" ? "Dış" : "İç"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.egitimDetayAciklama || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.egitimDetayAciklamaYeni || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.egitimTestSonucu || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.tazelemePlanlamaTarihi || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.veriyiGirenSicil || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">{row.veriGirisTarihi || "-"}</td>
                                            <td className="px-3 py-2 text-gray-500">
                                                {row.personelDurumu === "AYRILDI"
                                                    ? "Ayrıldı"
                                                    : row.personelDurumu === "IZINLI"
                                                        ? "İzinli"
                                                        : row.personelDurumu === "PASIF"
                                                            ? "Pasif"
                                                            : "Çalışan"}
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
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center justify-center gap-2"
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
                            {previewData.length} Kaydı İçeri Aktar
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
                                    <p className="text-gray-500">Oluşturulan</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-amber-600">{result.data.skipped}</p>
                                    <p className="text-gray-500">Atlanan (Duplicate)</p>
                                </div>
                            </div>
                        )}
                        {result.data?.errors?.length > 0 && (
                            <div className="mt-3 p-3 bg-red-100 rounded-lg">
                                <p className="font-medium text-red-700 mb-1">Hatalar:</p>
                                <ul className="text-sm text-red-600 list-disc list-inside">
                                    {result.data.errors.slice(0, 10).map((err: any, i: number) => (
                                        <li key={i}>{typeof err === "string" ? err : `Satır ${err.row ?? "?"}: ${err.message ?? "Bilinmeyen hata"}`}</li>
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


