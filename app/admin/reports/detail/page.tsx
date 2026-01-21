"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

interface AttendanceRecord {
    // 1. Personel Bilgileri
    sicilNo: string;
    adSoyad: string;
    tcKimlikNo: string;
    gorevi: string;
    projeAdi: string;
    grup: string;

    // 2. Eğitim Bilgileri
    egitimKodu: string;
    egitimAltBasligi: string | null;

    // 3. Zaman Bilgileri
    baslamaTarihi: string;
    bitisTarihi: string;
    egitimSuresiDk: number;
    baslamaSaati: string;
    bitisSaati: string;

    // 4. Eğitim Detay Bilgileri
    egitimYeri: string;
    egitmenAdi: string | null;
    sonucBelgesiTuru: string;
    icDisEgitim: string;
    egitimDetayliAciklama: string | null;

    // 5. Kayıt (Audit) Bilgileri
    veriGirenSicil: string;
    veriGirenAdSoyad: string;
    veriGirisTarihi: string;

    // 6. Personel Durumu
    personelDurumu: string;
}

export default function DetailedReportPage() {
    const [data, setData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        startDate: "",
        endDate: "",
        trainingCode: "",
        grup: "",
        personelDurumu: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append("search", filters.search);
            if (filters.startDate) params.append("startDate", filters.startDate);
            if (filters.endDate) params.append("endDate", filters.endDate);
            if (filters.trainingCode) params.append("trainingCode", filters.trainingCode);
            if (filters.grup) params.append("grup", filters.grup);
            if (filters.personelDurumu) params.append("personelDurumu", filters.personelDurumu);

            const res = await fetch(`/api/reports/detail?${params.toString()}`);
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (error) {
            console.error("Error loading report:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        loadData();
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            startDate: "",
            endDate: "",
            trainingCode: "",
            grup: "",
            personelDurumu: ""
        });
        loadData();
    };

    // Summary calculations
    const totalRecords = data.length;
    const totalMinutes = data.reduce((sum, r) => sum + (r.egitimSuresiDk || 0), 0);

    const exportToExcel = () => {
        const exportData = data.map(row => ({
            "Sicil No": row.sicilNo,
            "Ad Soyad": row.adSoyad,
            "TC Kimlik No": row.tcKimlikNo,
            "Görevi": row.gorevi,
            "Proje": row.projeAdi,
            "Grup": row.grup,
            "Eğitim Kodu": row.egitimKodu,
            "Eğitim Alt Başlık": row.egitimAltBasligi || "",
            "Eğitim Başlama Tarihi": row.baslamaTarihi,
            "Eğitim Bitiş Tarihi": row.bitisTarihi,
            "Eğitim Süresi (dk)": row.egitimSuresiDk,
            "Eğitim Başlama Saati": row.baslamaSaati,
            "Eğitim Bitiş Saati": row.bitisSaati,
            "Eğitim Yeri": row.egitimYeri,
            "Eğitmen Adı": row.egitmenAdi || "",
            "Sonuç Belgesi": row.sonucBelgesiTuru,
            "İç Dış Eğitim": row.icDisEgitim === 'IC' ? 'İç' : 'Dış',
            "Eğitim Detay": row.egitimDetayliAciklama || "",
            "Veri Giren": `${row.veriGirenSicil} - ${row.veriGirenAdSoyad}`,
            "Veri Girilme Tarihi ve Saati": row.veriGirisTarihi ? new Date(row.veriGirisTarihi).toLocaleString("tr-TR") : "",
            "Personel Durumu": row.personelDurumu
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const colWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 18 }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Detay Rapor");
        XLSX.writeFile(wb, `Egitim_Detay_Raporu_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Detaylı Eğitim Katılım Raporu</h1>
                    <p className="text-sm text-gray-500">06-DETAIL-TABLE-FINAL.md standardına uygun tam liste</p>
                </div>
                <button
                    onClick={exportToExcel}
                    disabled={data.length === 0}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel İndir (21 Sütun)
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
                {/* Quick Date Range Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Hızlı Tarih:</span>
                    <button
                        onClick={() => {
                            const today = new Date();
                            const startOfWeek = new Date(today);
                            startOfWeek.setDate(today.getDate() - today.getDay() + 1);
                            setFilters({
                                ...filters,
                                startDate: startOfWeek.toISOString().slice(0, 10),
                                endDate: today.toISOString().slice(0, 10)
                            });
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        Bu Hafta
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date();
                            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                            setFilters({
                                ...filters,
                                startDate: startOfMonth.toISOString().slice(0, 10),
                                endDate: today.toISOString().slice(0, 10)
                            });
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                        Bu Ay
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date();
                            const threeMonthsAgo = new Date(today);
                            threeMonthsAgo.setMonth(today.getMonth() - 3);
                            setFilters({
                                ...filters,
                                startDate: threeMonthsAgo.toISOString().slice(0, 10),
                                endDate: today.toISOString().slice(0, 10)
                            });
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                        Son 3 Ay
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date();
                            const sixMonthsAgo = new Date(today);
                            sixMonthsAgo.setMonth(today.getMonth() - 6);
                            setFilters({
                                ...filters,
                                startDate: sixMonthsAgo.toISOString().slice(0, 10),
                                endDate: today.toISOString().slice(0, 10)
                            });
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                        Son 6 Ay
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date();
                            const startOfYear = new Date(today.getFullYear(), 0, 1);
                            setFilters({
                                ...filters,
                                startDate: startOfYear.toISOString().slice(0, 10),
                                endDate: today.toISOString().slice(0, 10)
                            });
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                        Bu Yıl
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date();
                            const lastYear = new Date(today.getFullYear() - 1, 0, 1);
                            const endLastYear = new Date(today.getFullYear() - 1, 11, 31);
                            setFilters({
                                ...filters,
                                startDate: lastYear.toISOString().slice(0, 10),
                                endDate: endLastYear.toISOString().slice(0, 10)
                            });
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Geçen Yıl
                    </button>
                </div>

                {/* Main Filters */}
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                    <input
                        type="text"
                        placeholder="Ara (İsim, Sicil)"
                        className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Eğitim Kodu"
                        className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={filters.trainingCode}
                        onChange={e => setFilters({ ...filters, trainingCode: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Grup"
                        className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={filters.grup}
                        onChange={e => setFilters({ ...filters, grup: e.target.value })}
                    />
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Başlangıç Tarihi</label>
                        <input
                            type="date"
                            className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Bitiş Tarihi</label>
                        <input
                            type="date"
                            className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <button onClick={handleFilter} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filtrele
                    </button>
                    <button onClick={clearFilters} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Temizle
                    </button>
                </div>

                {/* Active Filter Tags */}
                {(filters.startDate || filters.endDate) && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-xs text-gray-500">Aktif Tarih Aralığı:</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-2">
                            📅 {filters.startDate || "..."} → {filters.endDate || "..."}
                            <button
                                onClick={() => setFilters({ ...filters, startDate: "", endDate: "" })}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                ×
                            </button>
                        </span>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500">Toplam Kayıt</div>
                    <div className="text-2xl font-bold text-gray-800">{totalRecords.toLocaleString('tr-TR')}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500">Toplam Dakika</div>
                    <div className="text-2xl font-bold text-blue-600">{totalMinutes.toLocaleString('tr-TR')}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500">Toplam Saat</div>
                    <div className="text-2xl font-bold text-green-600">{(totalMinutes / 60).toFixed(1)}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500">Benzersiz Eğitim</div>
                    <div className="text-2xl font-bold text-purple-600">{new Set(data.map(d => d.egitimKodu)).size}</div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">21 Sütunlu Tam Detay Tablosu</span>
                    <span className="text-xs text-gray-500">Yatay kaydırma için sağa sürükleyin →</span>
                </div>
                <div className="overflow-x-auto" style={{ maxHeight: '60vh' }}>
                    <table className="min-w-max w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                {/* 1. Personel Bilgileri */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50 border-r">Sicil No</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">Ad Soyad</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">TC Kimlik</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">Görevi</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">Proje</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50 border-r">Grup</th>

                                {/* 2. Eğitim Bilgileri */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-green-50">Eğitim Kodu</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-green-50 border-r">Alt Başlık</th>

                                {/* 3. Zaman Bilgileri */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50">Baş. Tarihi</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50">Bit. Tarihi</th>
                                <th className="px-3 py-3 text-right font-semibold text-gray-700 bg-yellow-50">Süre (dk)</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50">Baş. Saati</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50 border-r">Bit. Saati</th>

                                {/* 4. Eğitim Detay Bilgileri */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-orange-50">Eğitim Yeri</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-orange-50 border-r">Eğitmen Adı</th>

                                {/* 5. Belge & Diğer */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-purple-50">Sonuç Belgesi</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-purple-50">İç/Dış</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-purple-50 border-r">Eğitim Detay</th>

                                {/* 6. Kayıt (Audit) Bilgileri */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-red-50">Veri Giren</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-red-50 border-r">Giriş Tar.</th>

                                {/* 7. Durum */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-gray-200">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan={21} className="p-8 text-center text-gray-500">Yükleniyor...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={21} className="p-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
                            ) : (
                                data.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        {/* 1. Personel */}
                                        <td className="px-3 py-2 font-mono font-medium text-blue-700 bg-blue-50/30 border-r whitespace-nowrap">{row.sicilNo}</td>
                                        <td className="px-3 py-2 font-medium whitespace-nowrap">{row.adSoyad}</td>
                                        <td className="px-3 py-2 text-gray-500 font-mono text-[10px]">{row.tcKimlikNo}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.gorevi}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.projeAdi}</td>
                                        <td className="px-3 py-2 border-r">{row.grup}</td>

                                        {/* 2. Eğitim */}
                                        <td className="px-3 py-2 font-bold text-green-700 whitespace-nowrap">{row.egitimKodu}</td>
                                        <td className="px-3 py-2 text-gray-600 border-r max-w-[150px] truncate" title={row.egitimAltBasligi || ""}>
                                            {row.egitimAltBasligi || "-"}
                                        </td>

                                        {/* 3. Zaman */}
                                        <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">{row.baslamaTarihi}</td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">{row.bitisTarihi}</td>
                                        <td className="px-3 py-2 text-right font-bold text-orange-700">{row.egitimSuresiDk}</td>
                                        <td className="px-3 py-2 font-mono text-[11px]">{row.baslamaSaati}</td>
                                        <td className="px-3 py-2 font-mono text-[11px] border-r">{row.bitisSaati}</td>

                                        {/* 4. Detay */}
                                        <td className="px-3 py-2 max-w-[120px] truncate" title={row.egitimYeri}>{row.egitimYeri}</td>
                                        <td className="px-3 py-2 border-r whitespace-nowrap">{row.egitmenAdi || "-"}</td>

                                        {/* 5. Belge */}
                                        <td className="px-3 py-2 max-w-[120px] truncate text-[10px]" title={row.sonucBelgesiTuru}>{row.sonucBelgesiTuru}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${row.icDisEgitim === 'IC' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {row.icDisEgitim === 'IC' ? 'İç' : 'Dış'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 border-r max-w-[150px] truncate text-gray-500 text-[10px]" title={row.egitimDetayliAciklama || ""}>
                                            {row.egitimDetayliAciklama || "-"}
                                        </td>

                                        {/* 6. Audit */}
                                        <td className="px-3 py-2 text-gray-500 text-[10px] whitespace-nowrap">{row.veriGirenSicil} - {row.veriGirenAdSoyad}</td>
                                        <td className="px-3 py-2 text-gray-400 text-[10px] whitespace-nowrap border-r">
                                            {row.veriGirisTarihi ? new Date(row.veriGirisTarihi).toLocaleString("tr-TR") : "-"}
                                        </td>

                                        {/* 7. Durum */}
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${row.personelDurumu === 'CALISAN' ? 'bg-green-100 text-green-800' :
                                                row.personelDurumu === 'AYRILDI' ? 'bg-red-100 text-red-800' :
                                                    row.personelDurumu === 'PASIF' ? 'bg-gray-200 text-gray-600' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {row.personelDurumu}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Info */}
            <div className="flex justify-between items-center text-sm text-gray-500 px-1">
                <span>Detaylı Katılım Listesi</span>
                <span>Toplam Kayıt: <strong className="text-gray-800">{totalRecords}</strong> | Toplam Dakika: <strong className="text-blue-600">{totalMinutes.toLocaleString('tr-TR')}</strong></span>
            </div>
        </div>
    );
}
