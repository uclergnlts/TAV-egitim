/**
 * Statistics API
 * GET /api/reports/statistics?year=2026
 * Returns: Monthly trends, top trainings, group distribution, trainer stats
 */

import { NextRequest, NextResponse } from "next/server";
import { db, attendances, trainings } from "@/lib/db";
import { eq, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        // Auth check
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Bu işlem için yetkiniz yok" },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        // 1. Monthly Trend (12 months)
        const monthlyTrend = await db
            .select({
                month: attendances.month,
                count: sql<number>`CAST(count(*) AS INTEGER)`,
                totalMinutes: sql<number>`CAST(coalesce(sum(${attendances.egitimSuresiDk}), 0) AS INTEGER)`,
                uniquePersonnel: sql<number>`CAST(count(DISTINCT ${attendances.personelId}) AS INTEGER)`,
            })
            .from(attendances)
            .where(eq(attendances.year, year))
            .groupBy(attendances.month)
            .orderBy(attendances.month);

        // Fill missing months with zeros
        const monthlyData = Array(12).fill(null).map((_, i) => {
            const found = monthlyTrend.find(m => m.month === i + 1);
            return {
                month: i + 1,
                count: found?.count || 0,
                totalMinutes: found?.totalMinutes || 0,
                uniquePersonnel: found?.uniquePersonnel || 0,
            };
        });

        // 2. Top 10 Trainings
        const topTrainings = await db
            .select({
                code: attendances.egitimKodu,
                count: sql<number>`CAST(count(*) AS INTEGER)`,
                totalMinutes: sql<number>`CAST(coalesce(sum(${attendances.egitimSuresiDk}), 0) AS INTEGER)`,
            })
            .from(attendances)
            .where(eq(attendances.year, year))
            .groupBy(attendances.egitimKodu)
            .orderBy(desc(sql`count(*)`))
            .limit(10);

        // 3. Group Distribution
        const groupDistribution = await db
            .select({
                grup: attendances.grup,
                count: sql<number>`CAST(count(*) AS INTEGER)`,
                uniquePersonnel: sql<number>`CAST(count(DISTINCT ${attendances.personelId}) AS INTEGER)`,
            })
            .from(attendances)
            .where(eq(attendances.year, year))
            .groupBy(attendances.grup)
            .orderBy(desc(sql`count(*)`));

        // 4. Trainer Stats (Top 10)
        const trainerStats = await db
            .select({
                sicil: attendances.veriGirenSicil,
                name: attendances.veriGirenAdSoyad,
                count: sql<number>`CAST(count(*) AS INTEGER)`,
            })
            .from(attendances)
            .where(eq(attendances.year, year))
            .groupBy(attendances.veriGirenSicil, attendances.veriGirenAdSoyad)
            .orderBy(desc(sql`count(*)`))
            .limit(10);

        // 5. Summary Stats
        const summary = await db
            .select({
                totalParticipation: sql<number>`CAST(count(*) AS INTEGER)`,
                totalMinutes: sql<number>`CAST(coalesce(sum(${attendances.egitimSuresiDk}), 0) AS INTEGER)`,
                uniquePersonnel: sql<number>`CAST(count(DISTINCT ${attendances.personelId}) AS INTEGER)`,
                uniqueTrainings: sql<number>`CAST(count(DISTINCT ${attendances.trainingId}) AS INTEGER)`,
            })
            .from(attendances)
            .where(eq(attendances.year, year));

        // 6. Location Type Distribution (IC vs DIS)
        const locationTypeDistribution = await db
            .select({
                type: attendances.icDisEgitim,
                count: sql<number>`CAST(count(*) AS INTEGER)`,
            })
            .from(attendances)
            .where(eq(attendances.year, year))
            .groupBy(attendances.icDisEgitim);

        return NextResponse.json({
            success: true,
            data: {
                year,
                summary: summary[0] || {
                    totalParticipation: 0,
                    totalMinutes: 0,
                    uniquePersonnel: 0,
                    uniqueTrainings: 0,
                },
                monthlyTrend: monthlyData,
                topTrainings,
                groupDistribution,
                trainerStats,
                locationTypeDistribution,
            },
        });
    } catch (error) {
        console.error("Statistics API error:", error);
        return NextResponse.json(
            { success: false, message: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}
