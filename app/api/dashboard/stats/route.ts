/**
 * Dashboard Statistics API
 * Provides comprehensive statistics for dashboard charts and cards
 */

import { NextResponse } from "next/server";
import { db, attendances, trainings, personnel, trainers } from "@/lib/db";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false }, { status: 401 });
        }

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        // 1. Aylık trendi (son 12 ay)
        const monthlyTrend = await db
            .select({
                year: attendances.year,
                month: attendances.month,
                count: sql<number>`CAST(count(*) AS INTEGER)`,
                totalMinutes: sql<number>`CAST(coalesce(sum(${attendances.egitimSuresiDk}), 0) AS INTEGER)`,
            })
            .from(attendances)
            .where(
                sql`(${attendances.year} = ${currentYear} OR ${attendances.year} = ${currentYear - 1})`
            )
            .groupBy(attendances.year, attendances.month)
            .orderBy(attendances.year, attendances.month);

        // 2. Eğitim kategorilerine göre dağılım
        const trainingDistribution = await db
            .select({
                egitimKodu: attendances.egitimKodu,
                count: sql<number>`CAST(count(*) AS INTEGER)`,
            })
            .from(attendances)
            .where(eq(attendances.year, currentYear))
            .groupBy(attendances.egitimKodu)
            .orderBy(desc(sql`count(*)`))
            .limit(10);

        // 3. Gruplara göre dağılım
        const groupDistribution = await db
            .select({
                grup: attendances.grup,
                count: sql<number>`CAST(count(*) AS INTEGER)`,
            })
            .from(attendances)
            .where(eq(attendances.year, currentYear))
            .groupBy(attendances.grup)
            .orderBy(desc(sql`count(*)`))
            .limit(8);

        // 4. İç/Dış eğitim dağılımı
        const internalExternalRatio = await db
            .select({
                type: attendances.icDisEgitim,
                count: sql<number>`CAST(count(*) AS INTEGER)`,
            })
            .from(attendances)
            .where(eq(attendances.year, currentYear))
            .groupBy(attendances.icDisEgitim);

        // 5. Bu ay vs geçen ay karşılaştırma
        const thisMonthStats = await db
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

        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const lastMonthStats = await db
            .select({
                count: sql<number>`CAST(count(*) AS INTEGER)`,
                totalMinutes: sql<number>`CAST(coalesce(sum(${attendances.egitimSuresiDk}), 0) AS INTEGER)`,
            })
            .from(attendances)
            .where(
                and(
                    eq(attendances.year, lastMonthYear),
                    eq(attendances.month, lastMonth)
                )
            );

        // 6. Bu yıl toplam
        const yearlyStats = await db
            .select({
                count: sql<number>`CAST(count(*) AS INTEGER)`,
                totalMinutes: sql<number>`CAST(coalesce(sum(${attendances.egitimSuresiDk}), 0) AS INTEGER)`,
                uniquePersonnel: sql<number>`CAST(count(DISTINCT ${attendances.sicilNo}) AS INTEGER)`,
                uniqueTrainings: sql<number>`CAST(count(DISTINCT ${attendances.egitimKodu}) AS INTEGER)`,
            })
            .from(attendances)
            .where(eq(attendances.year, currentYear));

        // 7. Toplam personel ve eğitim sayısı
        const totalPersonnel = await db
            .select({ count: sql<number>`CAST(count(*) AS INTEGER)` })
            .from(personnel);

        const totalTrainings = await db
            .select({ count: sql<number>`CAST(count(*) AS INTEGER)` })
            .from(trainings);

        const totalTrainers = await db
            .select({ count: sql<number>`CAST(count(*) AS INTEGER)` })
            .from(trainers);

        // 8. Son 7 günlük aktivite
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentActivity = await db
            .select({
                date: attendances.baslamaTarihi,
                count: sql<number>`CAST(count(*) AS INTEGER)`,
            })
            .from(attendances)
            .where(gte(attendances.baslamaTarihi, sevenDaysAgo.toISOString().slice(0, 10)))
            .groupBy(attendances.baslamaTarihi)
            .orderBy(attendances.baslamaTarihi);

        // 9. Personel durumuna göre dağılım
        const personnelStatusDist = await db
            .select({
                status: personnel.personelDurumu,
                count: sql<number>`CAST(count(*) AS INTEGER)`,
            })
            .from(personnel)
            .groupBy(personnel.personelDurumu);

        return NextResponse.json({
            success: true,
            data: {
                monthlyTrend,
                trainingDistribution,
                groupDistribution,
                internalExternalRatio,
                thisMonth: {
                    count: thisMonthStats[0]?.count || 0,
                    totalMinutes: thisMonthStats[0]?.totalMinutes || 0,
                },
                lastMonth: {
                    count: lastMonthStats[0]?.count || 0,
                    totalMinutes: lastMonthStats[0]?.totalMinutes || 0,
                },
                yearly: {
                    count: yearlyStats[0]?.count || 0,
                    totalMinutes: yearlyStats[0]?.totalMinutes || 0,
                    uniquePersonnel: yearlyStats[0]?.uniquePersonnel || 0,
                    uniqueTrainings: yearlyStats[0]?.uniqueTrainings || 0,
                },
                totals: {
                    personnel: totalPersonnel[0]?.count || 0,
                    trainings: totalTrainings[0]?.count || 0,
                    trainers: totalTrainers[0]?.count || 0,
                },
                recentActivity,
                personnelStatusDist,
            },
        });
    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ success: false, message: "Veri alınamadı" }, { status: 500 });
    }
}
