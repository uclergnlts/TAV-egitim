
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trainingLocations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
// @ts-ignore
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const showAll = searchParams.get("all") === "true";

        let query = db.select().from(trainingLocations);

        if (!showAll) {
            // @ts-ignore
            query = query.where(eq(trainingLocations.isActive, true));
        }

        const data = await query.orderBy(desc(trainingLocations.createdAt));

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
        // @ts-ignore
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });
        }

        const [newRec] = await db.insert(trainingLocations)
            .values({ name })
            .returning();

        // Audit
        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "CREATE",
            entityType: "definition",
            entityId: newRec.id,
            newValue: newRec
        });

        return NextResponse.json({ success: true, data: newRec });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        // @ts-ignore
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { id, name, isActive } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "ID required" }, { status: 400 });
        }

        const oldData = await db.select().from(trainingLocations).where(eq(trainingLocations.id, id)).get();

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (isActive !== undefined) updateData.isActive = isActive;

        await db.update(trainingLocations)
            .set(updateData)
            .where(eq(trainingLocations.id, id));

        // Audit
        if (oldData) {
            await logAction({
                userId: session.userId,
                userRole: "ADMIN",
                actionType: "UPDATE",
                entityType: "definition",
                entityId: id,
                oldValue: oldData,
                newValue: updateData
            });
        }

        return NextResponse.json({ success: true, message: "Updated" });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        // @ts-ignore
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "ID required" }, { status: 400 });
        }

        const oldData = await db.select().from(trainingLocations).where(eq(trainingLocations.id, id)).get();

        // Soft Delete
        await db.update(trainingLocations)
            .set({ isActive: false })
            .where(eq(trainingLocations.id, id));

        // Audit
        if (oldData) {
            await logAction({
                userId: session.userId,
                userRole: "ADMIN",
                actionType: "DELETE",
                entityType: "definition",
                entityId: id,
                oldValue: oldData,
                newValue: { isActive: false }
            });
        }

        return NextResponse.json({ success: true, message: "Soft deleted" });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }
}
