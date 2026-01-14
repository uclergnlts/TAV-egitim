"use client";

import { useState, useEffect } from "react";
import { MONTHS_TR } from "@/lib/utils";

interface PivotRow {
    training_id: string;
    training_code: string;
    training_name: string;
    duration_min: number;
    category: string;
    months: number[];
    total_participation: number;
    total_minutes: number;
}

interface PivotData {
    year: number;
    rows: PivotRow[];
    month_totals: number[];
    grand_total_participation: number;
    grand_total_minutes: number;
}

export default function YearlyPivotPage() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [data, setData] = useState<PivotData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [year]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/yearly-pivot?year=${year}`);
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
                <h1 className="text-2xl font-bold text-gray-900">Yıllık Pivot Tablo</h1>

                <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {/* Summary Cards */}
            {data && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Toplam Katılım</p>
                        <p className="text-2xl font-bold text-gray-900">{data.grand_total_participation}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Toplam Dakika</p>
                        <p className="text-2xl font-bold text-gray-900">{data.grand_total_minutes.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Pivot Table */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                                        Eğitim
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Süre
                                    </th>
                                    {MONTHS_TR.map((m, i) => (
                                        <th key={i} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                            {m.substring(0, 3)}
                                        </th>
                                    ))}
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-900 uppercase bg-gray-100">
                                        Toplam
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-900 uppercase bg-gray-100">
                                        Dakika
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data?.rows.map((row) => (
                                    <tr key={row.training_id} className="hover:bg-gray-50">
                                        <td className="px-3 py-3 text-sm sticky left-0 bg-white">
                                            <div className="font-medium text-gray-900">{row.training_code}</div>
                                            <div className="text-xs text-gray-500">{row.training_name}</div>
                                        </td>
                                        <td className="px-3 py-3 text-sm text-center text-gray-500">
                                            {row.duration_min}
                                        </td>
                                        {row.months.map((count, i) => (
                                            <td key={i} className="px-2 py-3 text-sm text-center">
                                                {count > 0 ? (
                                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-medium">
                                                        {count}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-3 py-3 text-sm text-center font-bold bg-gray-50">
                                            {row.total_participation}
                                        </td>
                                        <td className="px-3 py-3 text-sm text-center font-bold bg-gray-50">
                                            {row.total_minutes.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}

                                {/* Totals Row */}
                                {data && (
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="px-3 py-3 text-sm sticky left-0 bg-gray-100">TOPLAM</td>
                                        <td className="px-3 py-3 text-sm text-center">-</td>
                                        {data.month_totals.map((total, i) => (
                                            <td key={i} className="px-2 py-3 text-sm text-center">
                                                {total > 0 ? total : "-"}
                                            </td>
                                        ))}
                                        <td className="px-3 py-3 text-sm text-center bg-blue-100 text-blue-900">
                                            {data.grand_total_participation}
                                        </td>
                                        <td className="px-3 py-3 text-sm text-center bg-blue-100 text-blue-900">
                                            {data.grand_total_minutes.toLocaleString()}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
