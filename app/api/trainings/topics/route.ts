
import { NextResponse } from "next/server";
import { db, trainingTopics } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: "Oturum açmanız gerekiyor" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const trainingId = searchParams.get("trainingId");

        if (!trainingId) {
            return NextResponse.json({ success: false, message: "Training ID zorunludur" }, { status: 400 });
        }

        const topics = await db
            .select()
            .from(trainingTopics)
            .where(eq(trainingTopics.trainingId, trainingId))
            .orderBy(asc(trainingTopics.orderNo));

        return NextResponse.json({
            success: true,
            data: topics,
        });

    } catch (error) {
        console.error("Topics list error:", error);
        return NextResponse.json({ success: false, message: "Hata oluştu" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const body = await request.json();

        if (!body.trainingId || !body.title) {
            return NextResponse.json({ success: false, message: "Eksik bilgi" }, { status: 400 });
        }

        // Mevcut en yüksek orderNo'yu bulalım
        const currentTopics = await db
            .select({ orderNo: trainingTopics.orderNo })
            .from(trainingTopics)
            .where(eq(trainingTopics.trainingId, body.trainingId)); // eq: tek bir koşul

        const maxOrder = currentTopics.reduce((max, t) => {
            const order = t.orderNo || 0;
            return order > max ? order : max;
        }, 0);

        const [newTopic] = await db.insert(trainingTopics).values({
            trainingId: body.trainingId,
            title: body.title,
            orderNo: maxOrder + 1,
            isActive: true
        }).returning();

        return NextResponse.json({
            success: true,
            data: newTopic,
        });

    } catch (error) {
        console.error("Topic create error:", error);
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

        await db.delete(trainingTopics).where(eq(trainingTopics.id, id));

        return NextResponse.json({ success: true, message: "Alt başlık silindi" });

    } catch (error) {
        console.error("Topic delete error:", error);
        return NextResponse.json({ success: false, message: "Hata" }, { status: 500 });
    }
}
