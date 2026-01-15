
import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import bcrypt from "bcryptjs";

// GET - List users
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Bu işlem için yetkiniz yok" },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const roleFilter = searchParams.get("role"); // CHEF, ADMIN, or null for all
        const search = searchParams.get("search") || "";

        let query = db.select({
            id: users.id,
            sicilNo: users.sicilNo,
            fullName: users.fullName,
            role: users.role,
            isActive: users.isActive,
            createdAt: users.createdAt,
        }).from(users);

        const conditions = [];

        if (roleFilter) {
            conditions.push(eq(users.role, roleFilter as "CHEF" | "ADMIN"));
        }

        if (search) {
            conditions.push(
                or(
                    like(users.sicilNo, `%${search}%`),
                    like(users.fullName, `%${search}%`)
                )
            );
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as typeof query;
        }

        const result = await query.orderBy(desc(users.createdAt));

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Users GET error:", error);
        return NextResponse.json(
            { success: false, message: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}

// POST - Create user
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Bu işlem için yetkiniz yok" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { sicil_no, full_name, role, password } = body;

        // Validation
        if (!sicil_no || !full_name || !role || !password) {
            return NextResponse.json(
                { success: false, message: "Tüm alanlar zorunludur" },
                { status: 400 }
            );
        }

        if (!["CHEF", "ADMIN"].includes(role)) {
            return NextResponse.json(
                { success: false, message: "Geçersiz rol" },
                { status: 400 }
            );
        }

        if (password.length < 4) {
            return NextResponse.json(
                { success: false, message: "Şifre en az 4 karakter olmalı" },
                { status: 400 }
            );
        }

        // Check if sicil_no already exists
        const existing = await db.select().from(users).where(eq(users.sicilNo, sicil_no)).limit(1);
        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, message: "Bu sicil numarası zaten kayıtlı" },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert
        const [newUser] = await db.insert(users).values({
            sicilNo: sicil_no,
            fullName: full_name,
            role: role,
            passwordHash: passwordHash,
            isActive: true,
        }).returning();

        // Audit log
        await logAction({
            userId: session.userId,
            userRole: session.role,
            actionType: "CREATE",
            entityType: "user",
            entityId: newUser.id,
            newValue: { sicil_no, full_name, role },
        });

        return NextResponse.json({
            success: true,
            message: "Kullanıcı başarıyla oluşturuldu",
            data: {
                id: newUser.id,
                sicilNo: newUser.sicilNo,
                fullName: newUser.fullName,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error("Users POST error:", error);
        return NextResponse.json(
            { success: false, message: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Bu işlem için yetkiniz yok" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { id, sicil_no, full_name, role, password, is_active } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID zorunludur" },
                { status: 400 }
            );
        }

        // Check exist
        const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, message: "Kullanıcı bulunamadı" },
                { status: 404 }
            );
        }

        // Build update object
        const updateData: Record<string, any> = {
            updatedAt: sql`CURRENT_TIMESTAMP`,
        };

        if (sicil_no) updateData.sicilNo = sicil_no;
        if (full_name) updateData.fullName = full_name;
        if (role && ["CHEF", "ADMIN"].includes(role)) updateData.role = role;
        if (typeof is_active === "boolean") updateData.isActive = is_active;

        if (password && password.length >= 4) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        await db.update(users).set(updateData).where(eq(users.id, id));

        // Audit log
        await logAction({
            userId: session.userId,
            userRole: session.role,
            actionType: "UPDATE",
            entityType: "user",
            entityId: id,
            oldValue: existing[0],
            newValue: updateData,
        });

        return NextResponse.json({
            success: true,
            message: "Kullanıcı güncellendi",
        });
    } catch (error) {
        console.error("Users PUT error:", error);
        return NextResponse.json(
            { success: false, message: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Bu işlem için yetkiniz yok" },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID zorunludur" },
                { status: 400 }
            );
        }

        // Get user info for audit
        const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (user.length === 0) {
            return NextResponse.json(
                { success: false, message: "Kullanıcı bulunamadı" },
                { status: 404 }
            );
        }

        // Prevent deleting self
        if (user[0].id === session.userId) {
            return NextResponse.json(
                { success: false, message: "Kendinizi silemezsiniz" },
                { status: 400 }
            );
        }

        await db.delete(users).where(eq(users.id, id));

        // Audit log
        await logAction({
            userId: session.userId,
            userRole: session.role,
            actionType: "DELETE",
            entityType: "user",
            entityId: id,
            oldValue: user[0],
        });

        return NextResponse.json({
            success: true,
            message: "Kullanıcı silindi",
        });
    } catch (error) {
        console.error("Users DELETE error:", error);
        return NextResponse.json(
            { success: false, message: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}
