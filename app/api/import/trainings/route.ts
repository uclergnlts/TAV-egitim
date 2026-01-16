/**
 * Eğitim Toplu Import API
 * POST /api/import/trainings
 * Excel'den eğitim ve alt başlık yükleme
 */

import { NextResponse } from "next/server";
import { db, trainings, trainingTopics } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";

interface ImportTrainingRow {
    code: string;
    name: string;
    duration_min: number;
    category?: string;
    default_location?: string;
    default_document_type?: string;
    topics?: string; // Virgülle ayrılmış alt başlıklar
}

export async function POST(request: Request) {
    try {
        // Auth check
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Yetkisiz işlem" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const rows: ImportTrainingRow[] = body.data;

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { success: false, message: "Veri bulunamadı" },
                { status: 400 }
            );
        }

        let created = 0;
        let updated = 0;
        let topicsCreated = 0;
        const errors: { row: number; message: string }[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            try {
                // Validate required fields
                if (!row.code || !row.name) {
                    errors.push({ row: i + 1, message: "Kod ve Ad zorunludur" });
                    continue;
                }

                const durationMin = typeof row.duration_min === 'string'
                    ? parseInt(row.duration_min, 10)
                    : (row.duration_min || 60);

                if (isNaN(durationMin)) {
                    errors.push({ row: i + 1, message: "Geçersiz süre değeri" });
                    continue;
                }

                // Normalize category
                let category = (row.category || "TEMEL").toUpperCase();
                if (!["TEMEL", "TAZELEME", "DIGER"].includes(category)) {
                    category = "TEMEL";
                }

                // Check if training exists
                const existing = await db
                    .select()
                    .from(trainings)
                    .where(eq(trainings.code, row.code))
                    .get();

                let trainingId: string;

                if (existing) {
                    // Update existing
                    await db.update(trainings)
                        .set({
                            name: row.name,
                            durationMin: durationMin,
                            category: category as "TEMEL" | "TAZELEME" | "DIGER",
                            defaultLocation: row.default_location || existing.defaultLocation,
                            defaultDocumentType: row.default_document_type as any || existing.defaultDocumentType,
                            isActive: true,
                            updatedAt: new Date().toISOString()
                        })
                        .where(eq(trainings.id, existing.id));

                    trainingId = existing.id;
                    updated++;

                    // Audit log
                    await logAction({
                        userId: session.userId,
                        userRole: "ADMIN",
                        actionType: "UPDATE",
                        entityType: "training",
                        entityId: trainingId,
                        oldValue: existing,
                        newValue: { ...row, durationMin, category }
                    });
                } else {
                    // Create new
                    const [newTraining] = await db.insert(trainings).values({
                        code: row.code,
                        name: row.name,
                        durationMin: durationMin,
                        category: category as "TEMEL" | "TAZELEME" | "DIGER",
                        defaultLocation: row.default_location || null,
                        defaultDocumentType: row.default_document_type as any || null,
                        isActive: true
                    }).returning();

                    trainingId = newTraining.id;
                    created++;

                    // Audit log
                    await logAction({
                        userId: session.userId,
                        userRole: "ADMIN",
                        actionType: "CREATE",
                        entityType: "training",
                        entityId: trainingId,
                        newValue: newTraining
                    });
                }

                // Handle topics (alt başlıklar)
                if (row.topics && row.topics.trim()) {
                    const topicTitles = row.topics.split(",").map(t => t.trim()).filter(t => t);

                    for (let j = 0; j < topicTitles.length; j++) {
                        const title = topicTitles[j];

                        // Check if topic already exists
                        const existingTopic = await db
                            .select()
                            .from(trainingTopics)
                            .where(eq(trainingTopics.trainingId, trainingId))
                            .all();

                        const topicExists = existingTopic.some(t => t.title === title);

                        if (!topicExists) {
                            await db.insert(trainingTopics).values({
                                trainingId: trainingId,
                                title: title,
                                orderNo: j + 1,
                                isActive: true
                            });
                            topicsCreated++;
                        }
                    }
                }

            } catch (err: any) {
                console.error(`Row ${i + 1} error:`, err);
                errors.push({ row: i + 1, message: err?.message || "Bilinmeyen hata" });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Import tamamlandı: ${created} yeni, ${updated} güncelleme, ${topicsCreated} alt başlık`,
            data: {
                created,
                updated,
                topicsCreated,
                errors
            }
        });

    } catch (error: any) {
        console.error("Training import error:", error);
        return NextResponse.json(
            { success: false, message: "Import hatası: " + (error?.message || "Bilinmeyen hata") },
            { status: 500 }
        );
    }
}
