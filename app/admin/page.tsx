/**
 * Admin Dashboard
 */

import { db, attendances } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import Link from "next/link";

import { unstable_cache } from "next/cache";

const getStats = unstable_cache(
    async () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        // Bu ay toplam katılım
        const monthlyStats = await db
            .select({
                count: sql<number>`CAST(count(*) AS INTEGER)`,
                totalMinutes: sql<number>`CAST(coalesce(sum(${attendances.egitimSuresiDk}), 0) AS INTEGER)`,
            })
            .from(attendances)
            .where(
                and(
                    eq(attendances.year, currentYear),
                    eq(attendances.month, currentMonth)
                )
            );

        // Bu yıl toplam katılım
        const yearlyStats = await db
            .select({
                count: sql<number>`CAST(count(*) AS INTEGER)`,
                totalMinutes: sql<number>`CAST(coalesce(sum(${attendances.egitimSuresiDk}), 0) AS INTEGER)`,
            })
            .from(attendances)
            .where(eq(attendances.year, currentYear));

        return {
            monthlyCount: monthlyStats[0]?.count || 0,
            monthlyMinutes: monthlyStats[0]?.totalMinutes || 0,
            yearlyCount: yearlyStats[0]?.count || 0,
            yearlyMinutes: yearlyStats[0]?.totalMinutes || 0,
        };
    },
    ['admin-dashboard-stats'], // Cache key
    { revalidate: 300 } // 5 dakika (300 saniye) cache
);

export default async function AdminDashboard() {
    const stats = await getStats();
    const currentYear = new Date().getFullYear();
    const months = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    const currentMonth = months[new Date().getMonth()];

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Bu Ay Katılım */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Bu Ay Katılım</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.monthlyCount}</p>
                            <p className="text-xs text-gray-400">{currentMonth} {currentYear}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Bu Ay Dakika */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Bu Ay Toplam Dakika</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.monthlyMinutes.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">{currentMonth} {currentYear}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Bu Yıl Katılım */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Bu Yıl Katılım</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.yearlyCount}</p>
                            <p className="text-xs text-gray-400">{currentYear}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Bu Yıl Dakika */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Bu Yıl Toplam Dakika</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.yearlyMinutes.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">{currentYear}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/admin/reports/monthly" className="bg-white rounded-xl shadow-sm border p-6 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Aylık Genel Tablo</h3>
                            <p className="text-sm text-gray-500">Seçilen ayın tüm katılım kayıtlarını görüntüle</p>
                        </div>
                    </div>
                </Link>

                <Link href="/admin/reports/yearly" className="bg-white rounded-xl shadow-sm border p-6 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Yıllık Pivot Tablo</h3>
                            <p className="text-sm text-gray-500">Eğitim bazlı yıllık dağılımı görüntüle</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
