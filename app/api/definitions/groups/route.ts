/**
 * Personel Grupları Yönetimi API
 * GET /api/definitions/groups - Listeleme
 * POST /api/definitions/groups - Yeni kayıt
 * PUT /api/definitions/groups - Güncelleme
 * DELETE /api/definitions/groups - Silme (soft delete)
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { personnelGroups } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const showAll = searchParams.get("all") === "true";

        let query = db.select().from(personnelGroups);

        if (!showAll) {
            // @ts-ignore
            query = query.where(eq(personnelGroups.isActive, true));
        }

        const data = await query.orderBy(desc(personnelGroups.createdAt));

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: "Grup adı zorunludur" }, { status: 400 });
        }

        const [newRec] = await db.insert(personnelGroups)
            .values({ name, description })
            .returning();

        // Audit
        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "CREATE",
            entityType: "personnelGroup",
            entityId: newRec.id,
            newValue: newRec
        });

        return NextResponse.json({ success: true, data: newRec });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: "Sunucu hatası" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const body = await request.json();
        const { id, name, description, isActive } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "ID zorunludur" }, { status: 400 });
        }

        const oldData = await db.select().from(personnelGroups).where(eq(personnelGroups.id, id)).get();

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;

        await db.update(personnelGroups)
            .set(updateData)
            .where(eq(personnelGroups.id, id));

        // Audit
        if (oldData) {
            await logAction({
                userId: session.userId,
                userRole: "ADMIN",
                actionType: "UPDATE",
                entityType: "personnelGroup",
                entityId: id,
                oldValue: oldData,
                newValue: { ...oldData, ...updateData }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: "Sunucu hatası" }, { status: 500 });
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
            return NextResponse.json({ success: false, message: "ID zorunludur" }, { status: 400 });
        }

        // Soft delete - isActive = false
        await db.update(personnelGroups)
            .set({ isActive: false })
            .where(eq(personnelGroups.id, id));

        // Audit
        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "DELETE",
            entityType: "personnelGroup",
            entityId: id
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: "Sunucu hatası" }, { status: 500 });
    }
}
