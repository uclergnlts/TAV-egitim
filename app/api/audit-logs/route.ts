/**
 * Audit Log API
 * GET /api/audit-logs
 * Admin only
 */

import { NextResponse } from "next/server";
import { db, auditLogs, users } from "@/lib/db";
import { desc, eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = (page - 1) * limit;

        // Count total
        const totalRes = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
        const total = totalRes[0].count;
        const totalPages = Math.ceil(total / limit);

        // Fetch logs with user info
        const logs = await db.select({
            id: auditLogs.id,
            actionType: auditLogs.actionType,
            entityType: auditLogs.entityType,
            entityId: auditLogs.entityId,
            actionTime: auditLogs.actionTime,
            ipAddress: auditLogs.ipAddress,
            details: auditLogs.newValue, // Storing newValue as main details for now, UI can expand
            userFullName: users.fullName,
            userSicil: users.sicilNo
        })
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.userId, users.id))
            .orderBy(desc(auditLogs.actionTime))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            success: true,
            data: logs,
            pagination: {
                total,
                page,
                totalPages,
                limit
            }
        });

    } catch (error) {
        console.error("Audit log list error:", error);
        return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }
}
