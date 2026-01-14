"use client";

import { useState, useEffect } from "react";
import { MONTHS_TR } from "@/lib/utils";

interface AttendanceRow {
    id: string;
    sicil_no: string;
    ad_soyad: string;
    gorevi: string;
    proje_adi: string;
    grup: string;
    egitim_kodu: string;
    egitim_suresi_dk: number;
    baslama_tarihi: string;
    personel_durumu: string;
}

export default function MonthlyReportPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [data, setData] = useState<{
        rows: AttendanceRow[];
        total_participation: number;
        total_minutes: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [year, month]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/monthly?year=${year}&month=${month}`);
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

    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Aylık Genel Tablo</h1>

                {/* Filters */}
                <div className="flex items-center space-x-4">
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        {MONTHS_TR.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            {data && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Toplam Katılım</p>
                        <p className="text-2xl font-bold text-gray-900">{data.total_participation}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Toplam Dakika</p>
                        <p className="text-2xl font-bold text-gray-900">{data.total_minutes.toLocaleString()}</p>
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
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sicil No</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Soyad</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Görevi</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grup</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eğitim</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Süre</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data?.rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">{row.sicil_no}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{row.ad_soyad}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{row.gorevi}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{row.proje_adi}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{row.grup}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                                {row.egitim_kodu}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{row.egitim_suresi_dk} dk</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(row.baslama_tarihi).toLocaleDateString("tr-TR")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
