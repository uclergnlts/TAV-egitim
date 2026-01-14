"use client";

import { useState, useEffect } from "react";

interface Attendance {
    id: string;
    sicil_no: string;
    ad_soyad: string;
    egitim_kodu: string;
    egitim_suresi_dk: number;
    baslama_tarihi: string;
    veri_giris_tarihi: string;
}

export default function ChefHistoryPage() {
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const res = await fetch("/api/attendances/my");
            const data = await res.json();
            if (data.success) {
                setAttendances(data.data);
            }
        } catch (err) {
            console.error("Failed to load history:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Kayıt Geçmişi</h1>

            {attendances.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                    <p className="text-gray-500">Henüz kayıt bulunmuyor.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sicil No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ad Soyad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Eğitim Kodu
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Süre (dk)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Eğitim Tarihi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {attendances.map((attendance) => (
                                <tr key={attendance.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {attendance.sicil_no}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {attendance.ad_soyad}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                            {attendance.egitim_kodu}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {attendance.egitim_suresi_dk}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(attendance.baslama_tarihi).toLocaleDateString("tr-TR")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
