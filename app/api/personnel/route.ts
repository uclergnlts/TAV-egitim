/**
 * Personel Yönetimi API
 * GET /api/personnel - Listeleme
 * POST /api/personnel - Yeni kayıt
 */

import { NextRequest, NextResponse } from "next/server";
import { db, personnel } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { desc, like, or, eq, sql, asc, and } from "drizzle-orm";
import { logAction } from "@/lib/audit";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const query = searchParams.get("query") || "";
        const sortBy = searchParams.get("sortBy") || "fullName";
        const sortOrder = searchParams.get("sortOrder") || "asc";
        const advancedFiltersParam = searchParams.get("advancedFilters") || "";

        const offset = (page - 1) * limit;

        // Build Where Clause
        const filters = [];
        if (query) {
            filters.push(or(
                like(personnel.sicilNo, `%${query}%`),
                like(personnel.fullName, `%${query}%`)
            ));
        }

        // Parse and apply advanced filters
        if (advancedFiltersParam) {
            try {
                const advancedFilters = JSON.parse(advancedFiltersParam);
                for (const filter of advancedFilters) {
                    const { field, operator, value } = filter;
                    
                    if (!value && value !== false && value !== 0) continue;

                    switch (operator) {
                        case "eq":
                            filters.push(eq(personnel[field as keyof typeof personnel] as any, value));
                            break;
                        case "ne":
                            filters.push(sql`${personnel[field as keyof typeof personnel]} != ${value}`);
                            break;
                        case "contains":
                            filters.push(like(personnel[field as keyof typeof personnel] as any, `%${value}%`));
                            break;
                        case "startsWith":
                            filters.push(like(personnel[field as keyof typeof personnel] as any, `${value}%`));
                            break;
                        case "endsWith":
                            filters.push(like(personnel[field as keyof typeof personnel] as any, `%${value}`));
                            break;
                        case "gt":
                            filters.push(sql`${personnel[field as keyof typeof personnel]} > ${value}`);
                            break;
                        case "gte":
                            filters.push(sql`${personnel[field as keyof typeof personnel]} >= ${value}`);
                            break;
                        case "lt":
                            filters.push(sql`${personnel[field as keyof typeof personnel]} < ${value}`);
                            break;
                        case "lte":
                            filters.push(sql`${personnel[field as keyof typeof personnel]} <= ${value}`);
                            break;
                    }
                }
            } catch (e) {
                console.error("Failed to parse advanced filters:", e);
            }
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Determine Sort Field
        let sortField = personnel.fullName; // Default
        if (sortBy === "sicilNo") sortField = personnel.sicilNo as any;
        else if (sortBy === "gorevi") sortField = personnel.gorevi as any;
        else if (sortBy === "grup") sortField = personnel.grup as any;
        else if (sortBy === "personelDurumu") sortField = personnel.personelDurumu as any;
        else if (sortBy === "createdAt") sortField = personnel.createdAt as any;

        const orderByClause = sortOrder === "desc" ? desc(sortField) : asc(sortField);

        // Count total records
        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(personnel)
            .where(whereClause);
        const total = totalResult[0].count;
        const totalPages = Math.ceil(total / limit);

        // Fetch data
        const result = await db.select()
            .from(personnel)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(orderByClause);

        return NextResponse.json({
            success: true,
            data: result,
            pagination: {
                total,
                page,
                totalPages,
                limit
            }
        });
    } catch (error) {
        console.error("Personel list error:", error);
        return NextResponse.json({ success: false, message: "Hata" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        // Zod validasyonu
        const { validateBody } = await import("@/lib/validationMiddleware");
        const { createPersonnelSchema } = await import("@/lib/validation");
        
        const validation = await validateBody(request, createPersonnelSchema);
        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
        }

        const data = validation.data;

        const [newPersonnel] = await db.insert(personnel).values({
            sicilNo: data.sicilNo,
            fullName: data.fullName,
            tcKimlikNo: data.tcKimlikNo,
            gorevi: data.gorevi,
            projeAdi: data.projeAdi,
            grup: data.grup,
            personelDurumu: data.personelDurumu,
            cinsiyet: data.cinsiyet,
            telefon: data.telefon,
            dogumTarihi: data.dogumTarihi,
            adres: data.adres,
        }).returning();

        // Audit Log
        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "CREATE",
            entityType: "personnel",
            entityId: newPersonnel.id,
            newValue: newPersonnel
        });

        return NextResponse.json({
            success: true,
            data: newPersonnel,
        });

    } catch (error: any) {
        console.error("Personel create error:", error);
        if (error.message?.includes("UNIQUE")) {
            return NextResponse.json({ success: false, message: "Bu sicil numarası zaten kayıtlı" }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: "Kayıt oluşturulamadı" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const body = await request.json();

        if (!body.id) {
            return NextResponse.json({ success: false, message: "ID zorunlu" }, { status: 400 });
        }

        // Fetch old data for audit
        const oldData = await db.select().from(personnel).where(eq(personnel.id, body.id)).get();

        const updateData = {
            sicilNo: body.sicilNo,
            fullName: body.fullName,
            tcKimlikNo: body.tcKimlikNo,
            gorevi: body.gorevi,
            projeAdi: body.projeAdi,
            grup: body.grup,
            personelDurumu: body.personelDurumu,
            cinsiyet: body.cinsiyet,
            telefon: body.telefon,
            dogumTarihi: body.dogumTarihi,
            adres: body.adres,
            updatedAt: new Date().toISOString()
        };

        await db.update(personnel)
            .set(updateData)
            .where(eq(personnel.id, body.id));

        // Audit Log
        if (oldData) {
            await logAction({
                userId: session.userId,
                userRole: "ADMIN",
                actionType: "UPDATE",
                entityType: "personnel",
                entityId: body.id,
                oldValue: oldData,
                newValue: updateData
            });
        }

        return NextResponse.json({ success: true, message: "Personel güncellendi" });

    } catch (error: any) {
        console.error("Personel update error:", error);
        return NextResponse.json({ success: false, message: "Güncelleme başarısız: " + error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "ID zorunlu" }, { status: 400 });
        }

        // Fetch old data for audit
        const oldData = await db.select().from(personnel).where(eq(personnel.id, id)).get();

        // Soft delete: Set status to PASIF
        await db.update(personnel)
            .set({
                personelDurumu: "PASIF",
                updatedAt: new Date().toISOString()
            })
            .where(eq(personnel.id, id));

        // Audit Log (Logged as DELETE action even though it's soft delete, to match user intent)
        // OR as UPDATE. The spec says "Katılım silme -> DELETE". For Personnel it says "Personel ekleme / silme / güncelleme".
        // Since it is a soft delete, technically it is an update, but logically it is a delete.
        // Let's log as DELETE to be explicit.
        if (oldData) {
            await logAction({
                userId: session.userId,
                userRole: "ADMIN",
                actionType: "DELETE",
                entityType: "personnel",
                entityId: id,
                oldValue: oldData,
                newValue: { personelDurumu: "PASIF" }
            });
        }

        return NextResponse.json({ success: true, message: "Personel silindi (Pasife alındı)" });

    } catch (error: any) {
        console.error("Personel delete error:", error);
        return NextResponse.json({ success: false, message: "Silme başarısız: " + error.message }, { status: 500 });
    }
}
