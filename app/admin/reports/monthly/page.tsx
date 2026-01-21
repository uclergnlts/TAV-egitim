"use client";

import { useState, useEffect } from "react";
import { MONTHS_TR } from "@/lib/utils";
import { useToast } from "@/components/ToastProvider";
import * as XLSX from "xlsx";

interface AttendanceRow {
    id: string;
    sicil_no: string;
    ad_soyad: string;
    tc_kimlik_no: string;
    gorevi: string;
    proje_adi: string;
    grup: string;
    egitim_kodu: string;
    egitim_alt_basligi: string | null;
    baslama_tarihi: string;
    bitis_tarihi: string;
    egitim_suresi_dk: number;
    baslama_saati: string;
    bitis_saati: string;
    egitim_yeri: string;
    egitmen_adi: string | null;
    sonuc_belgesi_turu: string;
    ic_dis_egitim: string;
    egitim_detayli_aciklama: string | null;
    veri_giren_sicil: string;
    veri_giren_ad_soyad: string;
    veri_giris_tarihi: string;
    personel_durumu: string;
}

// Tarih modları
type DateMode = 'month' | 'range';

export default function MonthlyReportPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Tarih modu - aylık veya tarih aralığı
    const [dateMode, setDateMode] = useState<DateMode>('month');
    
    // Aylık mod için
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    
    // Tarih aralığı modu için
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [data, setData] = useState<{
        rows: AttendanceRow[];
        total_participation: number;
        total_minutes: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Silme modalı
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Düzenleme modalı
    const [editRow, setEditRow] = useState<AttendanceRow | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editForm, setEditForm] = useState({
        baslama_tarihi: '',
        bitis_tarihi: '',
        baslama_saati: '',
        bitis_saati: '',
        egitim_yeri: '',
        egitim_detayli_aciklama: ''
    });
    
    const toast = useToast();

    // İlk yüklemede veri çek
    useEffect(() => {
        loadData();
    }, []);

    // Ay değiştiğinde yeniden yükle (sadece month modunda)
    useEffect(() => {
        if (dateMode === 'month') {
            loadData();
        }
    }, [year, month]);

    const loadData = async () => {
        setLoading(true);
        try {
            let url = '/api/reports/monthly';
            if (dateMode === 'range' && startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            } else {
                url += `?year=${year}&month=${month}`;
            }
            
            const res = await fetch(url);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (err) {
            console.error("Failed to load data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchRange = () => {
        if (!startDate || !endDate) {
            toast.error("Lütfen başlangıç ve bitiş tarihlerini seçin");
            return;
        }
        if (startDate > endDate) {
            toast.error("Başlangıç tarihi bitiş tarihinden sonra olamaz");
            return;
        }
        loadData();
    };

    // Hızlı tarih seçimi
    const setQuickRange = (type: 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear') => {
        const now = new Date();
        let start: Date, end: Date;
        
        switch (type) {
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'last3Months':
                start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'thisYear':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
        }
        
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleDelete = async (id: string) => {
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/attendances?id=${id}`, {
                method: "DELETE",
            });
            const result = await res.json();
            if (result.success) {
                toast.success("Kayıt başarıyla silindi");
                loadData();
                setDeleteId(null);
            } else {
                toast.error(result.message || "Silme işlemi başarısız");
            }
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Silme işlemi başarısız");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Düzenleme modalını aç
    const openEditModal = (row: AttendanceRow) => {
        setEditRow(row);
        setEditForm({
            baslama_tarihi: row.baslama_tarihi,
            bitis_tarihi: row.bitis_tarihi,
            baslama_saati: row.baslama_saati,
            bitis_saati: row.bitis_saati,
            egitim_yeri: row.egitim_yeri,
            egitim_detayli_aciklama: row.egitim_detayli_aciklama || ''
        });
    };

    // Düzenleme kaydet
    const handleEdit = async () => {
        if (!editRow) return;
        
        setEditLoading(true);
        try {
            const res = await fetch('/api/attendances', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editRow.id,
                    ...editForm
                })
            });
            const result = await res.json();
            if (result.success) {
                toast.success("Kayıt başarıyla güncellendi");
                loadData();
                setEditRow(null);
            } else {
                toast.error(result.message || "Güncelleme başarısız");
            }
        } catch (err) {
            console.error("Edit failed:", err);
            toast.error("Güncelleme başarısız");
        } finally {
            setEditLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!data?.rows.length) return;

        // API'den zaten sıralı geliyor (CALISAN → IZINLI → PASIF → AYRILDI)
        const exportData = data.rows.map(row => ({
            "Sicil No": row.sicil_no,
            "Ad Soyad": row.ad_soyad,
            "TC Kimlik": row.tc_kimlik_no,
            "Görevi": row.gorevi,
            "Proje": row.proje_adi,
            "Grup": row.grup,
            "Eğitim Kodu": row.egitim_kodu,
            "Eğitim Alt Başlık": row.egitim_alt_basligi || "",
            "Eğitim Başlama Tarihi": row.baslama_tarihi,
            "Eğitim Bitiş Tarihi": row.bitis_tarihi,
            "Eğitim Süresi (dk)": row.egitim_suresi_dk,
            "Eğitim Başlama Saati": row.baslama_saati,
            "Eğitim Bitiş Saati": row.bitis_saati,
            "Eğitim Yeri": row.egitim_yeri,
            "Eğitmen Adı": row.egitmen_adi || "",
            "Sonuç Belgesi": row.sonuc_belgesi_turu,
            "İç/Dış Eğitim": row.ic_dis_egitim === 'IC' ? 'İç' : 'Dış',
            "Eğitim Detay": row.egitim_detayli_aciklama || "",
            "Veri Giren": `${row.veri_giren_sicil} - ${row.veri_giren_ad_soyad}`,
            "Veri Giriş Tarihi": row.veri_giris_tarihi ? new Date(row.veri_giris_tarihi).toLocaleString("tr-TR") : "",
            "Personel Durumu": row.personel_durumu
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const colWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 16 }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        
        // Dosya adı tarih moduna göre
        let sheetName: string;
        let fileName: string;
        if (dateMode === 'range') {
            sheetName = `${startDate}_${endDate}`;
            fileName = `Rapor_${startDate}_${endDate}.xlsx`;
        } else {
            sheetName = `${MONTHS_TR[month - 1]} ${year}`;
            fileName = `Aylik_Rapor_${MONTHS_TR[month - 1]}_${year}.xlsx`;
        }
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Sheet name max 31 char
        XLSX.writeFile(wb, fileName);
    };

    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

    const totalMinutes = data?.total_minutes || 0;
    const uniqueTrainings = new Set(data?.rows.map(r => r.egitim_kodu) || []).size;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Aylık Genel Tablo</h1>
                    <p className="text-sm text-gray-500">Seçili döneme ait tüm katılım kayıtları</p>
                </div>

                <button
                    onClick={exportToExcel}
                    disabled={!data?.rows.length}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Excel İndir</span>
                </button>
            </div>

            {/* Tarih Seçimi */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                {/* Mod Seçimi */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setDateMode('month')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            dateMode === 'month' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Ay Seçimi
                    </button>
                    <button
                        onClick={() => setDateMode('range')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            dateMode === 'range' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Tarih Aralığı
                    </button>
                </div>

                {dateMode === 'month' ? (
                    // Aylık Mod
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {MONTHS_TR.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    // Tarih Aralığı Modu
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Başlangıç:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Bitiş:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <button
                                onClick={handleSearchRange}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                            >
                                Ara
                            </button>
                        </div>
                        
                        {/* Hızlı Seçim Butonları */}
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-gray-500 self-center">Hızlı seçim:</span>
                            <button
                                onClick={() => setQuickRange('thisMonth')}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Bu Ay
                            </button>
                            <button
                                onClick={() => setQuickRange('lastMonth')}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Geçen Ay
                            </button>
                            <button
                                onClick={() => setQuickRange('last3Months')}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Son 3 Ay
                            </button>
                            <button
                                onClick={() => setQuickRange('thisYear')}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Bu Yıl
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Toplam Katılım</p>
                        <p className="text-2xl font-bold text-gray-900">{data.total_participation}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Toplam Dakika</p>
                        <p className="text-2xl font-bold text-blue-600">{totalMinutes.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Toplam Saat</p>
                        <p className="text-2xl font-bold text-green-600">{(totalMinutes / 60).toFixed(1)}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Farklı Eğitim</p>
                        <p className="text-2xl font-bold text-purple-600">{uniqueTrainings}</p>
                    </div>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : data?.rows.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                    <p className="text-gray-500">Bu dönem için kayıt bulunmuyor.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Detaylı Tablo (21 Sütun)</span>
                        <span className="text-xs text-gray-500">Yatay kaydırma için sağa sürükleyin →</span>
                    </div>
                    <div className="overflow-x-auto" style={{ maxHeight: '60vh' }}>
                        <table className="min-w-max w-full divide-y divide-gray-200 text-xs">
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    {/* Personel Bilgileri */}
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50 border-r">Sicil No</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">Ad Soyad</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">TC Kimlik</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">Görevi</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">Proje</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50 border-r">Grup</th>
                                    {/* Eğitim Bilgileri */}
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-green-50">Eğitim Kodu</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-green-50 border-r">Alt Başlık</th>
                                    {/* Zaman Bilgileri */}
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50">Baş. Tarihi</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50">Bit. Tarihi</th>
                                    <th className="px-3 py-3 text-right font-semibold text-gray-700 bg-yellow-50">Süre (dk)</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50">Baş. Saati</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50 border-r">Bit. Saati</th>
                                    {/* Detay Bilgileri */}
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-orange-50">Eğitim Yeri</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-orange-50 border-r">Eğitmen Adı</th>
                                    {/* Belge & Diğer */}
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-purple-50">Sonuç Belgesi</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-purple-50">İç/Dış</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-purple-50 border-r">Eğitim Detay</th>
                                    {/* Audit */}
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-red-50">Veri Giren</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-red-50">Giriş Tar.</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-gray-200">Durum</th>
                                    <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-gray-100">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {data?.rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2 font-mono font-medium text-blue-700 bg-blue-50/30 border-r whitespace-nowrap">{row.sicil_no}</td>
                                        <td className="px-3 py-2 font-medium whitespace-nowrap">{row.ad_soyad}</td>
                                        <td className="px-3 py-2 text-gray-500 font-mono text-[10px]">{row.tc_kimlik_no}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.gorevi}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.proje_adi}</td>
                                        <td className="px-3 py-2 border-r">{row.grup}</td>
                                        <td className="px-3 py-2 font-bold text-green-700 whitespace-nowrap">{row.egitim_kodu}</td>
                                        <td className="px-3 py-2 text-gray-600 border-r max-w-[150px] truncate" title={row.egitim_alt_basligi || ""}>
                                            {row.egitim_alt_basligi || "-"}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">{row.baslama_tarihi}</td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">{row.bitis_tarihi}</td>
                                        <td className="px-3 py-2 text-right font-bold text-orange-700">{row.egitim_suresi_dk}</td>
                                        <td className="px-3 py-2 font-mono text-[11px]">{row.baslama_saati}</td>
                                        <td className="px-3 py-2 font-mono text-[11px] border-r">{row.bitis_saati}</td>
                                        <td className="px-3 py-2 max-w-[120px] truncate" title={row.egitim_yeri}>{row.egitim_yeri}</td>
                                        <td className="px-3 py-2 border-r whitespace-nowrap">{row.egitmen_adi || "-"}</td>
                                        <td className="px-3 py-2 max-w-[120px] truncate text-[10px]" title={row.sonuc_belgesi_turu}>{row.sonuc_belgesi_turu}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${row.ic_dis_egitim === 'IC' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {row.ic_dis_egitim === 'IC' ? 'İç' : 'Dış'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 border-r max-w-[150px] truncate text-gray-500 text-[10px]" title={row.egitim_detayli_aciklama || ""}>
                                            {row.egitim_detayli_aciklama || "-"}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 text-[10px] whitespace-nowrap">{row.veri_giren_sicil} - {row.veri_giren_ad_soyad}</td>
                                        <td className="px-3 py-2 text-gray-400 text-[10px] whitespace-nowrap">
                                            {row.veri_giris_tarihi ? new Date(row.veri_giris_tarihi).toLocaleString("tr-TR") : "-"}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${row.personel_durumu === 'CALISAN' ? 'bg-green-100 text-green-800' :
                                                row.personel_durumu === 'AYRILDI' ? 'bg-red-100 text-red-800' :
                                                    row.personel_durumu === 'PASIF' ? 'bg-gray-200 text-gray-600' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {row.personel_durumu}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(row)}
                                                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(row.id)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Sil"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Kaydı Sil</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Bu katılım kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                disabled={deleteLoading}
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => deleteId && handleDelete(deleteId)}
                                disabled={deleteLoading}
                                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {deleteLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Siliniyor...
                                    </>
                                ) : (
                                    "Evet, Sil"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editRow && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Kaydı Düzenle</h3>
                            </div>
                            <button
                                onClick={() => setEditRow(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Sadece okunur bilgiler */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div><span className="text-gray-500">Sicil:</span> <span className="font-medium">{editRow.sicil_no}</span></div>
                                <div><span className="text-gray-500">Ad Soyad:</span> <span className="font-medium">{editRow.ad_soyad}</span></div>
                                <div><span className="text-gray-500">Eğitim:</span> <span className="font-medium text-green-700">{editRow.egitim_kodu}</span></div>
                                <div><span className="text-gray-500">Süre:</span> <span className="font-medium">{editRow.egitim_suresi_dk} dk</span></div>
                            </div>
                        </div>

                        {/* Düzenlenebilir alanlar */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlama Tarihi</label>
                                    <input
                                        type="date"
                                        value={editForm.baslama_tarihi}
                                        onChange={(e) => setEditForm({ ...editForm, baslama_tarihi: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        value={editForm.bitis_tarihi}
                                        onChange={(e) => setEditForm({ ...editForm, bitis_tarihi: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlama Saati</label>
                                    <input
                                        type="time"
                                        value={editForm.baslama_saati}
                                        onChange={(e) => setEditForm({ ...editForm, baslama_saati: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Saati</label>
                                    <input
                                        type="time"
                                        value={editForm.bitis_saati}
                                        onChange={(e) => setEditForm({ ...editForm, bitis_saati: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Eğitim Yeri</label>
                                <input
                                    type="text"
                                    value={editForm.egitim_yeri}
                                    onChange={(e) => setEditForm({ ...editForm, egitim_yeri: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Eğitim yeri..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Detaylı Açıklama</label>
                                <textarea
                                    value={editForm.egitim_detayli_aciklama}
                                    onChange={(e) => setEditForm({ ...editForm, egitim_detayli_aciklama: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    rows={3}
                                    placeholder="Eğitim hakkında ek bilgiler..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditRow(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                disabled={editLoading}
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleEdit}
                                disabled={editLoading}
                                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {editLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    "Kaydet"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
