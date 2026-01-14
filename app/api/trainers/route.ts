/**
 * Eğitmen Listesi API
 * GET /api/trainers
 */

import { NextResponse } from "next/server";
import { db, trainers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false }, { status: 401 });
        }

        const result = await db
            .select()
            .from(trainers)
            .orderBy(trainers.fullName); // Sort by name default

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const body = await request.json();
        if (!body.fullName || !body.sicilNo) {
            return NextResponse.json({ success: false, message: "İsim ve Sicil No gereklidir" }, { status: 400 });
        }

        const [newTrainer] = await db.insert(trainers).values({
            fullName: body.fullName,
            sicilNo: body.sicilNo,
            isActive: true
        }).returning();

        // Audit Log
        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "CREATE",
            entityType: "trainer",
            entityId: newTrainer.id,
            newValue: newTrainer
        });

        return NextResponse.json({
            success: true,
            data: newTrainer,
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Hata" }, { status: 500 });
    }
}
export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const body = await request.json();
        if (!body.id || !body.fullName || !body.sicilNo) {
            return NextResponse.json({ success: false, message: "Eksik bilgi" }, { status: 400 });
        }

        // Fetch old data
        const oldData = await db.select().from(trainers).where(eq(trainers.id, body.id)).get();

        const [updatedTrainer] = await db.update(trainers)
            .set({
                fullName: body.fullName,
                sicilNo: body.sicilNo
            })
            .where(eq(trainers.id, body.id))
            .returning();

        // Audit Log
        if (oldData) {
            await logAction({
                userId: session.userId,
                userRole: "ADMIN",
                actionType: "UPDATE",
                entityType: "trainer",
                entityId: body.id,
                oldValue: oldData,
                newValue: updatedTrainer
            });
        }

        return NextResponse.json({
            success: true,
            data: updatedTrainer,
        });

    } catch (error) {
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
            return NextResponse.json({ success: false, message: "ID gerekli" }, { status: 400 });
        }

        // Fetch old data
        const oldData = await db.select().from(trainers).where(eq(trainers.id, id)).get();

        // Soft delete (Pasife al)
        await db.update(trainers)
            .set({ isActive: false })
            .where(eq(trainers.id, id));

        // Audit Log
        if (oldData) {
            await logAction({
                userId: session.userId,
                userRole: "ADMIN",
                actionType: "DELETE",
                entityType: "trainer",
                entityId: id,
                oldValue: oldData, // Logging the whole old object for context
                newValue: { isActive: false }
            });
        }

        return NextResponse.json({
            success: true,
            message: "Eğitmen pasife alındı"
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Hata" }, { status: 500 });
    }
}
