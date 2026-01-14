"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

interface AttendanceRecord {
    // 2.1 Personel Bilgileri (7)
    sicilNo: string;
    adSoyad: string;
    tcKimlikNo: string;
    gorevi: string;
    projeAdi: string;
    grup: string;
    personelDurumu: string;

    // 2.2 Eğitim Bilgileri (2)
    egitimKodu: string;
    egitimAltBasligi: string | null;

    // 2.3 Zaman Bilgileri (4)
    baslamaTarihi: string;
    bitisTarihi: string;
    baslamaSaati: string;
    bitisSaati: string;

    // 2.4 Eğitim Detay Bilgileri (3)
    egitimSuresiDk: number;
    egitimYeri: string;
    icDisEgitim: string;

    // 2.5 Belge & Açıklama (2)
    sonucBelgesiTuru: string;
    egitimDetayliAciklama: string | null;

    // 2.6 Kayıt (Audit) Bilgileri (3)
    veriGirenSicil: string;
    veriGirenAdSoyad: string;
    veriGirisTarihi: string;
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
            "sicil_no": row.sicilNo,
            "ad_soyad": row.adSoyad,
            "tc_kimlik_no": row.tcKimlikNo,
            "gorevi": row.gorevi,
            "proje_adi": row.projeAdi,
            "grup": row.grup,
            "personel_durumu": row.personelDurumu,
            "egitim_kodu": row.egitimKodu,
            "egitim_alt_basligi": row.egitimAltBasligi,
            "egitim_baslama_tarihi": row.baslamaTarihi,
            "egitim_bitis_tarihi": row.bitisTarihi,
            "egitim_baslama_saati": row.baslamaSaati,
            "egitim_bitis_saati": row.bitisSaati,
            "egitim_suresi_dk": row.egitimSuresiDk,
            "egitim_yeri": row.egitimYeri,
            "ic_dis_egitim": row.icDisEgitim,
            "sonuc_belgesi_turu": row.sonucBelgesiTuru,
            "egitim_detayli_aciklama": row.egitimDetayliAciklama,
            "veri_giren_sicil": row.veriGirenSicil,
            "veri_giren_ad_soyad": row.veriGirenAdSoyad,
            "veri_giris_tarihi": row.veriGirisTarihi
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
            <div className="bg-white p-4 rounded-xl shadow-sm border">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <input
                        type="text"
                        placeholder="Ara (İsim, Sicil)"
                        className="border rounded-lg p-2.5 text-sm"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Eğitim Kodu"
                        className="border rounded-lg p-2.5 text-sm"
                        value={filters.trainingCode}
                        onChange={e => setFilters({ ...filters, trainingCode: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Grup"
                        className="border rounded-lg p-2.5 text-sm"
                        value={filters.grup}
                        onChange={e => setFilters({ ...filters, grup: e.target.value })}
                    />
                    <input
                        type="date"
                        className="border rounded-lg p-2.5 text-sm"
                        value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                    />
                    <input
                        type="date"
                        className="border rounded-lg p-2.5 text-sm"
                        value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                    />
                    <div className="flex gap-2">
                        <button onClick={handleFilter} className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
                            Filtrele
                        </button>
                        <button onClick={clearFilters} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                            Temizle
                        </button>
                    </div>
                </div>
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
                                {/* 2.1 Personel Bilgileri */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50 border-r">Sicil No</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">Ad Soyad</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">TC Kimlik</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">Görevi</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">Proje</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50">Grup</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-blue-50 border-r">Durum</th>

                                {/* 2.2 Eğitim Bilgileri */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-green-50">Eğitim Kodu</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-green-50 border-r">Alt Başlık</th>

                                {/* 2.3 Zaman Bilgileri */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50">Baş. Tarihi</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50">Bit. Tarihi</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50">Baş. Saati</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-yellow-50 border-r">Bit. Saati</th>

                                {/* 2.4 Eğitim Detay Bilgileri */}
                                <th className="px-3 py-3 text-right font-semibold text-gray-700 bg-orange-50">Süre (dk)</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-orange-50">Eğitim Yeri</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-orange-50 border-r">İç/Dış</th>

                                {/* 2.5 Belge & Açıklama */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-purple-50">Belge Türü</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-purple-50 border-r">Açıklama</th>

                                {/* 2.6 Kayıt (Audit) Bilgileri */}
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-red-50">Giren Sicil</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-red-50">Giren Ad</th>
                                <th className="px-3 py-3 text-left font-semibold text-gray-700 bg-red-50">Giriş Tar.</th>
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
                                        {/* 2.1 Personel */}
                                        <td className="px-3 py-2 font-mono font-medium text-blue-700 bg-blue-50/30 border-r whitespace-nowrap">{row.sicilNo}</td>
                                        <td className="px-3 py-2 font-medium whitespace-nowrap">{row.adSoyad}</td>
                                        <td className="px-3 py-2 text-gray-500 font-mono text-[10px]">{row.tcKimlikNo}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.gorevi}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.projeAdi}</td>
                                        <td className="px-3 py-2">{row.grup}</td>
                                        <td className="px-3 py-2 border-r">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${row.personelDurumu === 'CALISAN' ? 'bg-green-100 text-green-800' :
                                                    row.personelDurumu === 'AYRILDI' ? 'bg-red-100 text-red-800' :
                                                        row.personelDurumu === 'PASIF' ? 'bg-gray-200 text-gray-600' :
                                                            'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {row.personelDurumu}
                                            </span>
                                        </td>

                                        {/* 2.2 Eğitim */}
                                        <td className="px-3 py-2 font-bold text-green-700 whitespace-nowrap">{row.egitimKodu}</td>
                                        <td className="px-3 py-2 text-gray-600 border-r max-w-[150px] truncate" title={row.egitimAltBasligi || ""}>
                                            {row.egitimAltBasligi || "-"}
                                        </td>

                                        {/* 2.3 Zaman */}
                                        <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">{row.baslamaTarihi}</td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">{row.bitisTarihi}</td>
                                        <td className="px-3 py-2 font-mono text-[11px]">{row.baslamaSaati}</td>
                                        <td className="px-3 py-2 font-mono text-[11px] border-r">{row.bitisSaati}</td>

                                        {/* 2.4 Detay */}
                                        <td className="px-3 py-2 text-right font-bold text-orange-700">{row.egitimSuresiDk}</td>
                                        <td className="px-3 py-2 max-w-[120px] truncate" title={row.egitimYeri}>{row.egitimYeri}</td>
                                        <td className="px-3 py-2 border-r">
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${row.icDisEgitim === 'IC' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {row.icDisEgitim === 'IC' ? 'İç' : 'Dış'}
                                            </span>
                                        </td>

                                        {/* 2.5 Belge */}
                                        <td className="px-3 py-2 max-w-[120px] truncate text-[10px]" title={row.sonucBelgesiTuru}>{row.sonucBelgesiTuru}</td>
                                        <td className="px-3 py-2 border-r max-w-[150px] truncate text-gray-500 text-[10px]" title={row.egitimDetayliAciklama || ""}>
                                            {row.egitimDetayliAciklama || "-"}
                                        </td>

                                        {/* 2.6 Audit */}
                                        <td className="px-3 py-2 text-gray-500 font-mono text-[10px] whitespace-nowrap">{row.veriGirenSicil}</td>
                                        <td className="px-3 py-2 text-gray-500 text-[10px] whitespace-nowrap">{row.veriGirenAdSoyad}</td>
                                        <td className="px-3 py-2 text-gray-400 text-[10px] whitespace-nowrap">
                                            {row.veriGirisTarihi ? new Date(row.veriGirisTarihi).toLocaleDateString("tr-TR") : "-"}
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
                <span>Referans: 06-DETAIL-TABLE-FINAL.md</span>
                <span>Toplam Kayıt: <strong className="text-gray-800">{totalRecords}</strong> | Toplam Dakika: <strong className="text-blue-600">{totalMinutes.toLocaleString('tr-TR')}</strong></span>
            </div>
        </div>
    );
}
