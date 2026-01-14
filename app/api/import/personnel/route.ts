/**
 * Personnel Import API
 * POST /api/import/personnel
 * Accepts JSON array of personnel records parsed from Excel on client-side
 */

import { NextRequest, NextResponse } from "next/server";
import { db, personnel } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";

interface PersonnelImportRow {
    sicilNo: string;
    fullName: string;
    tcKimlikNo?: string;
    gorevi?: string;
    projeAdi?: string;
    grup?: string;
    personelDurumu?: string;
    cinsiyet?: string;
    telefon?: string;
    dogumTarihi?: string;
    adres?: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const body = await request.json();
        const rows: PersonnelImportRow[] = body.data;

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ success: false, message: "Veri bulunamadı" }, { status: 400 });
        }

        const results = {
            created: 0,
            updated: 0,
            errors: [] as string[],
        };

        for (const row of rows) {
            try {
                if (!row.sicilNo || !row.fullName) {
                    results.errors.push(`Satır geçersiz: Sicil No veya Ad Soyad eksik`);
                    continue;
                }

                // Check if exists
                const existing = await db.query.personnel.findFirst({
                    where: eq(personnel.sicilNo, row.sicilNo.toString().trim()),
                });

                if (existing) {
                    // Update
                    await db.update(personnel)
                        .set({
                            fullName: row.fullName,
                            tcKimlikNo: row.tcKimlikNo || existing.tcKimlikNo,
                            gorevi: row.gorevi || existing.gorevi,
                            projeAdi: row.projeAdi || existing.projeAdi,
                            grup: row.grup || existing.grup,
                            personelDurumu: (row.personelDurumu as any) || existing.personelDurumu,
                            cinsiyet: (row.cinsiyet as "ERKEK" | "KADIN" | null) || existing.cinsiyet,
                            telefon: row.telefon || existing.telefon,
                            dogumTarihi: row.dogumTarihi || existing.dogumTarihi,
                            adres: row.adres || existing.adres,
                            updatedAt: new Date().toISOString()
                        })
                        .where(eq(personnel.id, existing.id));
                    results.updated++;
                } else {
                    // Create
                    await db.insert(personnel).values({
                        sicilNo: row.sicilNo.toString().trim(),
                        fullName: row.fullName,
                        tcKimlikNo: row.tcKimlikNo || "00000000000",
                        gorevi: row.gorevi || "Personel",
                        projeAdi: row.projeAdi || "TAV ESB",
                        grup: row.grup || "Genel",
                        personelDurumu: (row.personelDurumu as any) || "CALISAN",
                        cinsiyet: (row.cinsiyet as "ERKEK" | "KADIN" | undefined),
                        telefon: row.telefon,
                        dogumTarihi: row.dogumTarihi,
                        adres: row.adres,
                    });
                    results.created++;
                }
            } catch (err: any) {
                results.errors.push(`${row.sicilNo}: ${err.message}`);
            }
        }

        // Log Import Action
        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "IMPORT",
            entityType: "import",
            entityId: `PERSONNEL-IMPORT-${Date.now()}`,
            newValue: { created: results.created, updated: results.updated, errorCount: results.errors.length }
        });

        return NextResponse.json({
            success: true,
            message: `${results.created} yeni kayıt oluşturuldu, ${results.updated} kayıt güncellendi.`,
            data: results
        });

    } catch (error: any) {
        console.error("Personnel import error:", error);
        return NextResponse.json({ success: false, message: "Import hatası: " + error.message }, { status: 500 });
    }
}
