"use client";

import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
    AreaChart,
    Area,
} from "recharts";

interface DashboardData {
    monthlyTrend: { year: number; month: number; count: number; totalMinutes: number }[];
    trainingDistribution: { egitimKodu: string; count: number }[];
    groupDistribution: { grup: string; count: number }[];
    internalExternalRatio: { type: string; count: number }[];
    thisMonth: { count: number; totalMinutes: number };
    lastMonth: { count: number; totalMinutes: number };
    yearly: { count: number; totalMinutes: number; uniquePersonnel: number; uniqueTrainings: number };
    totals: { personnel: number; trainings: number; trainers: number };
    recentActivity: { date: string; count: number }[];
    personnelStatusDist: { status: string; count: number }[];
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];
const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export default function DashboardCharts() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await fetch("/api/dashboard/stats");
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch (error) {
            console.error("Dashboard data error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border p-6 h-80 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-64 bg-gray-100 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!data) return null;

    // Transform monthly trend data
    const monthlyChartData = data.monthlyTrend.map((item) => ({
        name: `${MONTHS[item.month - 1]} ${item.year}`,
        katılım: item.count,
        dakika: item.totalMinutes,
    })).slice(-12);

    // Calculate change percentages
    const countChange = data.lastMonth.count > 0
        ? ((data.thisMonth.count - data.lastMonth.count) / data.lastMonth.count * 100).toFixed(1)
        : "0";
    const minuteChange = data.lastMonth.totalMinutes > 0
        ? ((data.thisMonth.totalMinutes - data.lastMonth.totalMinutes) / data.lastMonth.totalMinutes * 100).toFixed(1)
        : "0";

    return (
        <div className="space-y-6">
            {/* Extended Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <StatCard
                    title="Bu Ay Katılım"
                    value={data.thisMonth.count}
                    change={countChange}
                    icon="👥"
                    color="blue"
                />
                <StatCard
                    title="Bu Ay Dakika"
                    value={data.thisMonth.totalMinutes.toLocaleString()}
                    change={minuteChange}
                    icon="⏱️"
                    color="green"
                />
                <StatCard
                    title="Yıllık Katılım"
                    value={data.yearly.count.toLocaleString()}
                    subtext={`${data.yearly.uniquePersonnel} farklı kişi`}
                    icon="📊"
                    color="purple"
                />
                <StatCard
                    title="Toplam Personel"
                    value={data.totals.personnel.toLocaleString()}
                    icon="👤"
                    color="indigo"
                />
                <StatCard
                    title="Toplam Eğitim"
                    value={data.totals.trainings}
                    icon="📚"
                    color="amber"
                />
                <StatCard
                    title="Toplam Eğitmen"
                    value={data.totals.trainers}
                    icon="🎓"
                    color="rose"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend Chart */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Aylık Katılım Trendi</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={monthlyChartData}>
                            <defs>
                                <linearGradient id="colorKatilim" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="katılım"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                fill="url(#colorKatilim)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Training Distribution Pie */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 En Popüler Eğitimler</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={data.trainingDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="count"
                                nameKey="egitimKodu"
                                label={({ egitimKodu, percent }) =>
                                    `${egitimKodu} (${(percent * 100).toFixed(0)}%)`
                                }
                                labelLine={false}
                            >
                                {data.trainingDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Group Distribution Bar Chart */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 Gruplara Göre Katılım</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data.groupDistribution} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="grup" type="category" width={80} tick={{ fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                            />
                            <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Internal vs External & Personnel Status */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 İç/Dış Eğitim & Personel Durumu</h3>
                    <div className="grid grid-cols-2 gap-4 h-64">
                        {/* Internal/External */}
                        <div>
                            <p className="text-sm text-gray-500 text-center mb-2">İç/Dış Eğitim</p>
                            <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie
                                        data={data.internalExternalRatio.map((i) => ({
                                            name: i.type === "IC" ? "İç Eğitim" : "Dış Eğitim",
                                            value: i.count,
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={50}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        <Cell fill="#3B82F6" />
                                        <Cell fill="#8B5CF6" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Personnel Status */}
                        <div>
                            <p className="text-sm text-gray-500 text-center mb-2">Personel Durumu</p>
                            <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie
                                        data={data.personnelStatusDist.map((i) => ({
                                            name: i.status,
                                            value: i.count,
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={50}
                                        dataKey="value"
                                        label={({ name }) => name}
                                        labelLine={false}
                                    >
                                        {data.personnelStatusDist.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            {data.recentActivity.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Son 7 Günlük Aktivite</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.recentActivity}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(val) => new Date(val).toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" })}
                                tick={{ fontSize: 11 }}
                            />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                labelFormatter={(val) => new Date(val).toLocaleDateString("tr-TR")}
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                            />
                            <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Katılım" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

function StatCard({
    title,
    value,
    change,
    subtext,
    icon,
    color,
}: {
    title: string;
    value: string | number;
    change?: string;
    subtext?: string;
    icon: string;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
        indigo: "bg-indigo-50 text-indigo-600",
        amber: "bg-amber-50 text-amber-600",
        rose: "bg-rose-50 text-rose-600",
    };

    const isPositive = change && parseFloat(change) >= 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{title}</span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${colorClasses[color]}`}>
                    {icon}
                </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
                <p className={`text-xs mt-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
                    {isPositive ? "↑" : "↓"} {Math.abs(parseFloat(change))}% geçen aya göre
                </p>
            )}
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    );
}
