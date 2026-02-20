/**
 * Health Check API
 * GET /api/health - Uygulama ve veritabanı sağlık kontrolü
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
    try {
        // DB bağlantı testi
        const result = await db.get<{ ok: number }>(sql`SELECT 1 as ok`);

        if (result?.ok !== 1) {
            return NextResponse.json(
                { status: "unhealthy", db: "failed" },
                { status: 503 }
            );
        }

        return NextResponse.json({
            status: "healthy",
            db: "connected",
            timestamp: new Date().toISOString(),
        });
    } catch {
        return NextResponse.json(
            { status: "unhealthy", db: "unreachable" },
            { status: 503 }
        );
    }
}
