/**
 * Egitim Toplu Import API
 * POST /api/import/trainings
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
    topics?: string;
}

function normalizeDocumentType(value?: string): "EGITIM_KATILIM_CIZELGESI" | "SERTIFIKA" | undefined {
    if (!value) return undefined;
    const s = value.toLowerCase();
    if (s.includes("sertifika")) return "SERTIFIKA";
    if (s.includes("katilim") || s.includes("katılım") || s.includes("cizelge") || s.includes("çizelge")) {
        return "EGITIM_KATILIM_CIZELGESI";
    }
    if (value === "EGITIM_KATILIM_CIZELGESI" || value === "SERTIFIKA") return value;
    return undefined;
}

export async function POST(request: Request) {
    try {
        const { checkRateLimit, getClientIP, RateLimitPresets } = await import("@/lib/rateLimit");
        const clientIP = getClientIP(request);
        const rateLimitResult = checkRateLimit(`import:trainings:${clientIP}`, RateLimitPresets.export);

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { success: false, message: "Çok fazla import isteği. Lütfen bir süre bekleyin." },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
                        "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
                    },
                }
            );
        }

        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const body = await request.json();
        const rows: ImportTrainingRow[] = body.data;

        if (!rows || rows.length === 0) {
            return NextResponse.json({ success: false, message: "Veri bulunamadı" }, { status: 400 });
        }

        let created = 0;
        let updated = 0;
        let topicsCreated = 0;
        const errors: { row: number; message: string }[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            try {
                const code = String(row.code ?? "").trim();
                const name = String(row.name ?? "").trim();
                if (!code || !name) {
                    errors.push({ row: i + 1, message: "Kod ve Ad zorunludur" });
                    continue;
                }

                const durationMin = typeof row.duration_min === "string"
                    ? parseInt(row.duration_min, 10)
                    : (row.duration_min || 60);

                if (isNaN(durationMin)) {
                    errors.push({ row: i + 1, message: "Gecersiz sure degeri" });
                    continue;
                }

                let category = (row.category || "TEMEL").toUpperCase();
                if (!(["TEMEL", "TAZELEME", "DIGER"] as const).includes(category as "TEMEL" | "TAZELEME" | "DIGER")) {
                    category = "TEMEL";
                }

                const existing = await db
                    .select()
                    .from(trainings)
                    .where(eq(trainings.code, code))
                    .get();

                let trainingId: string;

                if (existing) {
                    await db.update(trainings)
                        .set({
                            name,
                            durationMin,
                            category: category as "TEMEL" | "TAZELEME" | "DIGER",
                            defaultLocation: row.default_location || existing.defaultLocation,
                            defaultDocumentType: normalizeDocumentType(row.default_document_type) || existing.defaultDocumentType,
                            isActive: true,
                            updatedAt: new Date().toISOString(),
                        })
                        .where(eq(trainings.id, existing.id));

                    trainingId = existing.id;
                    updated++;

                    await logAction({
                        userId: session.userId,
                        userRole: "ADMIN",
                        actionType: "UPDATE",
                        entityType: "training",
                        entityId: trainingId,
                        oldValue: existing,
                        newValue: { ...row, code, name, durationMin, category },
                    });
                } else {
                    const [newTraining] = await db.insert(trainings).values({
                        code,
                        name,
                        durationMin,
                        category: category as "TEMEL" | "TAZELEME" | "DIGER",
                        defaultLocation: row.default_location || null,
                        defaultDocumentType: normalizeDocumentType(row.default_document_type) || null,
                        isActive: true,
                    }).returning();

                    trainingId = newTraining.id;
                    created++;

                    await logAction({
                        userId: session.userId,
                        userRole: "ADMIN",
                        actionType: "CREATE",
                        entityType: "training",
                        entityId: trainingId,
                        newValue: newTraining,
                    });
                }

                if (row.topics && row.topics.trim()) {
                    const topicTitles = row.topics
                        .split(/[;,]/)
                        .map((t) => t.trim())
                        .filter(Boolean);

                    const existingTopicRows = await db
                        .select()
                        .from(trainingTopics)
                        .where(eq(trainingTopics.trainingId, trainingId))
                        .all();

                    const existingTopicSet = new Set(existingTopicRows.map((t) => t.title));

                    for (let j = 0; j < topicTitles.length; j++) {
                        const title = topicTitles[j];
                        if (existingTopicSet.has(title)) continue;

                        await db.insert(trainingTopics).values({
                            trainingId,
                            title,
                            orderNo: j + 1,
                            isActive: true,
                        });
                        topicsCreated++;
                        existingTopicSet.add(title);
                    }
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "Bilinmeyen hata";
                errors.push({ row: i + 1, message });
            }
        }

        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "IMPORT",
            entityType: "import",
            entityId: `TRAINING-IMPORT-${Date.now()}`,
            newValue: { created, updated, topicsCreated, errorCount: errors.length },
        });

        return NextResponse.json({
            success: true,
            message: `Import tamamlandı: ${created} yeni, ${updated} güncelleme, ${topicsCreated} alt başlık`,
            data: { created, updated, topicsCreated, errors },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Bilinmeyen hata";
        return NextResponse.json({ success: false, message: `Import hatası: ${message}` }, { status: 500 });
    }
}
