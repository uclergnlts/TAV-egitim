import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { headers } from "next/headers";

type ActionType = "CREATE" | "UPDATE" | "DELETE" | "IMPORT" | "LOGIN";
type EntityType = "attendance" | "personnel" | "training" | "trainer" | "definition" | "user" | "import" | "personnelGroup";

interface LogActionParams {
    userId: string;
    userRole: "CHEF" | "ADMIN";
    actionType: ActionType;
    entityType: EntityType;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
}

/**
 * Audit Log Insert Function
 * Fire-and-forget style to prevent blocking main thread, 
 * but since Vercel serverless might freeze execution, we await it safely.
 */
export async function logAction(params: LogActionParams) {
    try {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        await db.insert(auditLogs).values({
            userId: params.userId,
            userRole: params.userRole,
            actionType: params.actionType,
            entityType: params.entityType,
            entityId: params.entityId,
            oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
            newValue: params.newValue ? JSON.stringify(params.newValue) : null,
            ipAddress: ip,
            userAgent: userAgent,
        });

    } catch (error) {
        // Audit log failures should not crash the app
        // Log with full context for debugging
        console.error("AUDIT_LOG_ERROR:", {
            timestamp: new Date().toISOString(),
            action: params.actionType,
            entity: params.entityType,
            entityId: params.entityId,
            userId: params.userId,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
