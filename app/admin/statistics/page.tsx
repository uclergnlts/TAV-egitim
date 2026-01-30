"use client";

import { useState, useEffect, Suspense } from "react";
import { MONTHS_TR } from "@/lib/utils";
import dynamic from "next/dynamic";

// Lazy load chart components
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import("recharts").then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });

interface StatisticsData {
    year: number;
    summary: {
        totalParticipation: number;
        totalMinutes: number;
        uniquePersonnel: number;
        uniqueTrainings: number;
    };
    monthlyTrend: Array<{
        month: number;
        count: number;
        totalMinutes: number;
        uniquePersonnel: number;
    }>;
    topTrainings: Array<{
        code: string;
        count: number;
        totalMinutes: number;
    }>;
    groupDistribution: Array<{
        grup: string;
        count: number;
        uniquePersonnel: number;
    }>;
    trainerStats: Array<{
        sicil: string;
        name: string;
        count: number;
    }>;
    locationTypeDistribution: Array<{
        type: string;
        count: number;
    }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function StatisticsPage() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [data, setData] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [year]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/statistics?year=${year}`);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (err) {
            console.error("Failed to load statistics:", err);
        } finally {
            setLoading(false);
        }
    };

    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

    // Prepare chart data
    const monthlyChartData = data?.monthlyTrend.map(m => ({
        name: MONTHS_TR[m.month - 1].substring(0, 3),
        fullName: MONTHS_TR[m.month - 1],
        Katılım: m.count,
        Dakika: m.totalMinutes,
        Personel: m.uniquePersonnel,
    })) || [];

    const pieData = data?.groupDistribution.slice(0, 8).map((g, i) => ({
        name: g.grup || 'Belirsiz',
        value: g.count,
        color: COLORS[i % COLORS.length],
    })) || [];

    const locationData = data?.locationTypeDistribution.map(l => ({
        name: l.type === 'IC' ? 'İç Eğitim' : 'Dış Eğitim',
        value: l.count,
        color: l.type === 'IC' ? '#3B82F6' : '#8B5CF6',
    })) || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Eğitim İstatistikleri</h1>
                    <p className="text-sm text-gray-500">Yıllık eğitim performans analizi</p>
                </div>

                <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white"
                    aria-label="Yıl seçin"
                >
                    {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 md:p-6 text-white shadow-lg">
                    <p className="text-blue-100 text-sm">Toplam Katılım</p>
                    <p className="text-2xl md:text-4xl font-bold mt-1">{data?.summary.totalParticipation.toLocaleString()}</p>
                    <p className="text-blue-200 text-xs mt-2">kayıt</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 md:p-6 text-white shadow-lg">
                    <p className="text-green-100 text-sm">Toplam Saat</p>
                    <p className="text-2xl md:text-4xl font-bold mt-1">{Math.round((data?.summary.totalMinutes || 0) / 60).toLocaleString()}</p>
                    <p className="text-green-200 text-xs mt-2">saat eğitim</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 md:p-6 text-white shadow-lg">
                    <p className="text-purple-100 text-sm">Eğitim Alan</p>
                    <p className="text-2xl md:text-4xl font-bold mt-1">{data?.summary.uniquePersonnel.toLocaleString()}</p>
                    <p className="text-purple-200 text-xs mt-2">farklı personel</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 md:p-6 text-white shadow-lg">
                    <p className="text-orange-100 text-sm">Farklı Eğitim</p>
                    <p className="text-2xl md:text-4xl font-bold mt-1">{data?.summary.uniqueTrainings}</p>
                    <p className="text-orange-200 text-xs mt-2">eğitim türü</p>
                </div>
            </div>

            {/* Charts Row 1 - Lazy Loaded */}
            <Suspense fallback={
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border p-6 h-80 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="h-64 bg-gray-100 rounded"></div>
                        </div>
                    ))}
                </div>
            }>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Trend */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Aylık Katılım Trendi</h3>
                        <div className="h-64 md:h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyChartData}>
                                    <defs>
                                        <linearGradient id="colorKatilim" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                                    />
                                    <Area type="monotone" dataKey="Katılım" stroke="#3B82F6" strokeWidth={2} fill="url(#colorKatilim)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Trainings */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">En Çok Verilen Eğitimler</h3>
                        <div className="h-64 md:h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.topTrainings.slice(0, 8)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis dataKey="code" type="category" width={80} tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                                    <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} name="Katılım" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </Suspense>

            {/* Charts Row 2 - Lazy Loaded */}
            <Suspense fallback={
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border p-6 h-64 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="h-48 bg-gray-100 rounded"></div>
                        </div>
                    ))}
                </div>
            }>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Group Distribution Pie */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Grup Dağılımı</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Location Type */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">İç/Dış Eğitim</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={locationData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {locationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Data Entry Staff */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">En Aktif Veri Girenler</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {data?.trainerStats.map((t, i) => (
                            <div key={t.sicil} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'
                                    }`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm truncate">{t.name}</p>
                                    <p className="text-xs text-gray-500">{t.sicil}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-blue-600">{t.count}</p>
                                    <p className="text-xs text-gray-400">kayıt</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    </div>
                </div>
            </Suspense>

            {/* Monthly Detail Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 md:p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Aylık Detay Tablosu</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Ay</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Katılım</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Dakika</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Saat</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Personel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {monthlyChartData.map((m, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{m.fullName}</td>
                                    <td className="px-4 py-3 text-right text-blue-600 font-semibold">{m.Katılım.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{m.Dakika.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-green-600">{(m.Dakika / 60).toFixed(1)}</td>
                                    <td className="px-4 py-3 text-right text-purple-600">{m.Personel}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-100 font-bold">
                                <td className="px-4 py-3">TOPLAM</td>
                                <td className="px-4 py-3 text-right text-blue-700">{data?.summary.totalParticipation.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-700">{data?.summary.totalMinutes.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-green-700">{((data?.summary.totalMinutes || 0) / 60).toFixed(1)}</td>
                                <td className="px-4 py-3 text-right text-purple-700">{data?.summary.uniquePersonnel}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
