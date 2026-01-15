/**
 * Eğitim Listesi API
 * GET /api/trainings
 * Yetki: ŞEF, ADMIN
 */

import { NextResponse } from "next/server";
import { db, trainings, trainingTopics } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET() {
    try {
        // Oturum kontrolü
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        // Aktif eğitimleri getir
        const trainingList = await db
            .select({
                id: trainings.id,
                code: trainings.code,
                name: trainings.name,
                duration_min: trainings.durationMin,
                category: trainings.category,
                default_location: trainings.defaultLocation,
                default_document_type: trainings.defaultDocumentType,
            })
            .from(trainings)
            .where(eq(trainings.isActive, true))
            .orderBy(trainings.code);

        // Her eğitim için alt başlıkları getir
        const result = await Promise.all(
            trainingList.map(async (training) => {
                const topics = await db
                    .select({
                        id: trainingTopics.id,
                        title: trainingTopics.title,
                        order_no: trainingTopics.orderNo,
                    })
                    .from(trainingTopics)
                    .where(eq(trainingTopics.trainingId, training.id))
                    .orderBy(trainingTopics.orderNo);

                return {
                    ...training,
                    has_topics: topics.length > 0,
                    topics,
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Trainings list error:", error);
        return NextResponse.json(
            { success: false, message: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const body = await request.json();
        console.log("Creating training with body:", body);

        // Basic validation
        if (!body.code || !body.name || body.duration_min === undefined || body.duration_min === null) {
            console.log("Validation failed: Missing fields", body);
            return NextResponse.json({ success: false, message: "Eksik bilgi: Kod, Ad ve Süre zorunludur" }, { status: 400 });
        }

        let durationMin = 0;
        try {
            durationMin = typeof body.duration_min === 'string' ? parseInt(body.duration_min, 10) : Number(body.duration_min);
        } catch (e) {
            console.error("Duration parse error", e);
        }

        if (isNaN(durationMin)) {
            console.log("Validation failed: Invalid duration", body.duration_min);
            return NextResponse.json({ success: false, message: "Geçersiz süre" }, { status: 400 });
        }

        const [newTraining] = await db.insert(trainings).values({
            code: body.code,
            name: body.name,
            durationMin: durationMin,
            category: body.category || "TEMEL",
            defaultLocation: body.default_location || null,
            defaultDocumentType: body.default_document_type || null,
            isActive: true
        }).returning();

        // Audit Log
        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "CREATE",
            entityType: "training",
            entityId: newTraining.id,
            newValue: newTraining
        });

        return NextResponse.json({
            success: true,
            data: newTraining,
        });

    } catch (error: any) {
        console.error("Training create error:", error);

        // Handle unique constraint violation
        if (error?.message?.includes("UNIQUE constraint failed: trainings.code")) {
            return NextResponse.json({ success: false, message: "Bu eğitim kodu zaten kullanılıyor" }, { status: 400 });
        }

        return NextResponse.json({ success: false, message: "Kayıt başarısız: " + (error?.message || "Bilinmeyen hata") }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const body = await request.json();

        if (!body.id || !body.code || !body.name) {
            return NextResponse.json({ success: false, message: "Eksik bilgi" }, { status: 400 });
        }

        // Fetch old data
        const oldData = await db.select().from(trainings).where(eq(trainings.id, body.id)).get();

        const [updatedTraining] = await db.update(trainings)
            .set({
                code: body.code,
                name: body.name,
                durationMin: body.duration_min,
                category: body.category,
                defaultLocation: body.default_location || null,
                defaultDocumentType: body.default_document_type || null,
            })
            .where(eq(trainings.id, body.id))
            .returning();

        // Audit Log
        if (oldData) {
            await logAction({
                userId: session.userId,
                userRole: "ADMIN",
                actionType: "UPDATE",
                entityType: "training",
                entityId: body.id,
                oldValue: oldData,
                newValue: updatedTraining
            });
        }

        return NextResponse.json({
            success: true,
            data: updatedTraining,
        });

    } catch (error) {
        console.error("Training update error:", error);
        return NextResponse.json({ success: false, message: "Hata" }, { status: 500 });
    }
}


export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "ID gereklidir" }, { status: 400 });
        }

        // Fetch old data
        const oldData = await db.select().from(trainings).where(eq(trainings.id, id)).get();

        // Soft delete: isActive = false yapıyoruz
        await db.update(trainings)
            .set({ isActive: false })
            .where(eq(trainings.id, id));

        // Audit Log
        if (oldData) {
            await logAction({
                userId: session.userId,
                userRole: "ADMIN",
                actionType: "DELETE",
                entityType: "training",
                entityId: id,
                oldValue: oldData,
                newValue: { isActive: false }
            });
        }

        return NextResponse.json({ success: true, message: "Eğitim silindi (Pasife alındı)" });

    } catch (error) {
        console.error("Training delete error:", error);
        return NextResponse.json({ success: false, message: "Hata" }, { status: 500 });
    }
}
