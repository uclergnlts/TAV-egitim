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
        const id = searchParams.get("id");

        if (id) {
            const person = await db.select().from(personnel).where(eq(personnel.id, id)).get();

            if (!person) {
                return NextResponse.json({ success: false, message: "Personel bulunamadı" }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                data: person,
            });
        }

        const rawPage = parseInt(searchParams.get("page") || "1", 10);
        const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
        const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
        const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 200)) : 50;
        const query = (searchParams.get("query") || "").trim();
        const sortBy = searchParams.get("sortBy") || "fullName";
        const sortOrder = searchParams.get("sortOrder") || "asc";
        const advancedFiltersParam = searchParams.get("advancedFilters") || "";

        const offset = (page - 1) * limit;

        // Build Where Clause
        const filters = [];
        if (query) {
            const isNumeric = /^\d+$/.test(query);

            if (isNumeric) {
                filters.push(
                    or(
                        eq(personnel.sicilNo, query),
                        eq(personnel.tcKimlikNo, query),
                        like(personnel.sicilNo, `${query}%`),
                        like(personnel.tcKimlikNo, `${query}%`)
                    )
                );
            } else {
                filters.push(
                    or(
                        like(personnel.fullName, `${query}%`),
                        like(personnel.fullName, `% ${query}%`),
                        like(personnel.sicilNo, `${query}%`)
                    )
                );
            }
        }

        // Parse and apply advanced filters (whitelist approach)
        const ALLOWED_FILTER_FIELDS = [
            "sicilNo", "fullName", "tcKimlikNo", "gorevi",
            "projeAdi", "grup", "personelDurumu", "cinsiyet", "email"
        ] as const;
        type AllowedField = typeof ALLOWED_FILTER_FIELDS[number];
        const ALLOWED_OPERATORS = ["eq", "ne", "contains", "startsWith", "endsWith", "gt", "gte", "lt", "lte"];

        if (advancedFiltersParam) {
            try {
                const advancedFilters = JSON.parse(advancedFiltersParam);
                if (!Array.isArray(advancedFilters)) throw new Error("invalid");

                for (const filter of advancedFilters) {
                    const { field, operator, value } = filter;

                    if (!value && value !== false && value !== 0) continue;
                    if (!ALLOWED_FILTER_FIELDS.includes(field as AllowedField)) continue;
                    if (!ALLOWED_OPERATORS.includes(operator)) continue;

                    // Sanitize value: only allow string/number, max 200 chars
                    const safeValue = String(value).slice(0, 200);
                    const col = personnel[field as AllowedField];

                    switch (operator) {
                        case "eq":
                            filters.push(eq(col as any, safeValue));
                            break;
                        case "ne":
                            filters.push(sql`${col} != ${safeValue}`);
                            break;
                        case "contains":
                            filters.push(like(col as any, `%${safeValue}%`));
                            break;
                        case "startsWith":
                            filters.push(like(col as any, `${safeValue}%`));
                            break;
                        case "endsWith":
                            filters.push(like(col as any, `%${safeValue}`));
                            break;
                        case "gt":
                            filters.push(sql`${col} > ${safeValue}`);
                            break;
                        case "gte":
                            filters.push(sql`${col} >= ${safeValue}`);
                            break;
                        case "lt":
                            filters.push(sql`${col} < ${safeValue}`);
                            break;
                        case "lte":
                            filters.push(sql`${col} <= ${safeValue}`);
                            break;
                    }
                }
            } catch {
                // Invalid filter format, skip
            }
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Determine Sort Field
        const sortFieldMap = {
            fullName: personnel.fullName,
            sicilNo: personnel.sicilNo,
            gorevi: personnel.gorevi,
            grup: personnel.grup,
            personelDurumu: personnel.personelDurumu,
            createdAt: personnel.createdAt,
        } as const;
        const sortField = sortFieldMap[sortBy as keyof typeof sortFieldMap] ?? personnel.fullName;

        const orderByClause = sortOrder === "desc" ? desc(sortField) : asc(sortField);

        // Count total records
        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(personnel)
            .where(whereClause);
        const total = Number(totalResult[0]?.count ?? 0);
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
    } catch {
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
            email: data.email,
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

    } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message?.includes("UNIQUE")) {
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
            email: body.email,
            updatedAt: new Date().toISOString()
        };

        const [updatedPersonnel] = await db.update(personnel)
            .set(updateData)
            .where(eq(personnel.id, body.id))
            .returning();

        // Audit Log
        if (oldData) {
            await logAction({
                userId: session.userId,
                userRole: "ADMIN",
                actionType: "UPDATE",
                entityType: "personnel",
                entityId: body.id,
                oldValue: oldData,
                newValue: updatedPersonnel ?? updateData
            });
        }

        return NextResponse.json({
            success: true,
            message: "Personel güncellendi",
            data: updatedPersonnel,
        });

    } catch {
        return NextResponse.json({ success: false, message: "Güncelleme başarısız" }, { status: 500 });
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

    } catch {
        return NextResponse.json({ success: false, message: "Silme başarısız" }, { status: 500 });
    }
}
