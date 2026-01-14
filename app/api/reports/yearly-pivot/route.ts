/**
 * Yıllık Pivot Rapor API
 * GET /api/reports/yearly-pivot?year=2026
 * Referans: 13-API-SPEC.md, 08-YEARLY-PIVOT-TABLE.md
 * Yetki: ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { db, attendances, trainings } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        // Oturum kontrolü - Sadece ADMIN
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Bu işlem için yetkiniz yok" },
                { status: 403 }
            );
        }

        // Query parametreleri
        const searchParams = request.nextUrl.searchParams;
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        // Validasyon
        if (isNaN(year)) {
            return NextResponse.json(
                { success: false, message: "Geçersiz yıl parametresi" },
                { status: 400 }
            );
        }

        // Tüm aktif eğitimleri getir
        const trainingList = await db
            .select({
                id: trainings.id,
                code: trainings.code,
                name: trainings.name,
                duration_min: trainings.durationMin,
                category: trainings.category,
            })
            .from(trainings)
            .where(eq(trainings.isActive, true))
            .orderBy(trainings.category, trainings.code);

        // Her eğitim için aylık sayıları getir
        const pivotData = await Promise.all(
            trainingList.map(async (training) => {
                // Her ay için count al
                const monthlyCounts = await db
                    .select({
                        month: attendances.month,
                        count: sql<number>`CAST(count(*) AS INTEGER)`,
                    })
                    .from(attendances)
                    .where(
                        and(
                            eq(attendances.trainingId, training.id),
                            eq(attendances.year, year)
                        )
                    )
                    .groupBy(attendances.month);

                // Ay bazlı map oluştur
                const monthMap: Record<number, number> = {};
                monthlyCounts.forEach((mc) => {
                    monthMap[mc.month] = mc.count;
                });

                // 12 ay için array oluştur
                const months = Array.from({ length: 12 }, (_, i) => monthMap[i + 1] || 0);
                const totalParticipation = months.reduce((sum, m) => sum + m, 0);
                const totalMinutes = totalParticipation * training.duration_min;

                return {
                    training_id: training.id,
                    training_code: training.code,
                    training_name: training.name,
                    duration_min: training.duration_min,
                    category: training.category,
                    months,
                    total_participation: totalParticipation,
                    total_minutes: totalMinutes,
                };
            })
        );

        // Genel toplamlar
        const monthTotals = Array.from({ length: 12 }, (_, monthIndex) =>
            pivotData.reduce((sum, row) => sum + row.months[monthIndex], 0)
        );
        const grandTotalParticipation = pivotData.reduce((sum, row) => sum + row.total_participation, 0);
        const grandTotalMinutes = pivotData.reduce((sum, row) => sum + row.total_minutes, 0);

        return NextResponse.json({
            success: true,
            data: {
                year,
                rows: pivotData,
                month_totals: monthTotals,
                grand_total_participation: grandTotalParticipation,
                grand_total_minutes: grandTotalMinutes,
            },
        });
    } catch (error) {
        console.error("Yearly pivot report error:", error);
        return NextResponse.json(
            { success: false, message: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}
