/**
 * Katılım Kayıt API (Batch)
 * POST /api/attendances - Yeni katılım kayıtları oluştur (ŞEF)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, attendances, personnel, trainings, trainingTopics, trainers } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getYear, getMonth } from "@/lib/utils";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
    try {
        // Oturum kontrolü
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        // Sadece ŞEF katılım kaydı oluşturabilir
        if (session.role !== "CHEF") {
            return NextResponse.json(
                { success: false, message: "Bu işlem için yetkiniz yok" },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validasyon
        const requiredFields = [
            "sicil_nos", // Array of strings
            "training_id",
            "ic_dis_egitim",
            "egitim_yeri",
            "baslama_tarihi",
            "bitis_tarihi",
            "baslama_saati",
            "bitis_saati",
            "sonuc_belgesi_turu",
            "trainer_id" // Yeni zorunlu alan
        ];

        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { success: false, message: `Zorunlu alan eksik: ${field}` },
                    { status: 400 }
                );
            }
        }

        const sicilNos = Array.isArray(body.sicil_nos) ? body.sicil_nos : [body.sicil_nos];
        if (sicilNos.length === 0) {
            return NextResponse.json(
                { success: false, message: "En az bir personel seçilmeli" },
                { status: 400 }
            );
        }

        // Eğitimi bul
        const trainingData = await db.query.trainings.findFirst({
            where: eq(trainings.id, body.training_id),
        });

        if (!trainingData) {
            return NextResponse.json(
                { success: false, message: "Eğitim bulunamadı" },
                { status: 400 }
            );
        }

        // Eğitmen
        let trainerData = null;
        if (body.trainer_id) {
            trainerData = await db.query.trainers.findFirst({
                where: eq(trainers.id, body.trainer_id),
            });
            if (!trainerData) {
                return NextResponse.json(
                    { success: false, message: "Eğitmen bulunamadı" },
                    { status: 400 }
                );
            }
        }

        // Alt başlık
        let topicTitle = null;
        if (body.training_topic_id) {
            const topic = await db.query.trainingTopics.findFirst({
                where: eq(trainingTopics.id, body.training_topic_id),
            });
            if (topic) {
                topicTitle = topic.title;
            }
        }

        // Yıl ve ay hesapla
        const year = getYear(body.baslama_tarihi);
        const month = getMonth(body.baslama_tarihi);

        const results = {
            success_count: 0,
            error_count: 0,
            errors: [] as string[],
        };

        const batchLogDetails: any[] = [];

        // Batch işlem
        for (const sicilNo of sicilNos) {
            try {
                // Temizle
                const cleanSicil = sicilNo.trim();
                if (!cleanSicil) continue;

                // Personeli bul
                const personelData = await db.query.personnel.findFirst({
                    where: eq(personnel.sicilNo, cleanSicil),
                });

                if (!personelData) {
                    results.error_count++;
                    results.errors.push(`${cleanSicil}: Personel sistemde bulunamadı`);
                    continue;
                }

                if (personelData.personelDurumu === "PASIF") {
                    results.error_count++;
                    results.errors.push(`${cleanSicil}: Personel PASİF durumda, eğitim atanamaz.`);
                    continue;
                }

                // Duplicate kontrolü
                const existingAttendance = await db.query.attendances.findFirst({
                    where: and(
                        eq(attendances.personelId, personelData.id),
                        eq(attendances.trainingId, body.training_id),
                        eq(attendances.year, year)
                    ),
                });

                if (existingAttendance) {
                    results.error_count++;
                    results.errors.push(`${cleanSicil}: Bu eğitimi ${year} yılında zaten almış`);
                    continue;
                }

                // Kayıt oluştur
                const [newRecord] = await db.insert(attendances).values({
                    personelId: personelData.id,
                    trainingId: body.training_id,
                    trainingTopicId: body.training_topic_id || null,
                    trainerId: body.trainer_id,

                    sicilNo: personelData.sicilNo,
                    adSoyad: personelData.fullName,
                    tcKimlikNo: personelData.tcKimlikNo,
                    gorevi: personelData.gorevi,
                    projeAdi: personelData.projeAdi,
                    grup: personelData.grup,
                    personelDurumu: personelData.personelDurumu,

                    egitimKodu: trainingData.code,
                    egitimAltBasligi: topicTitle,

                    baslamaTarihi: body.baslama_tarihi,
                    bitisTarihi: body.bitis_tarihi,
                    baslamaSaati: body.baslama_saati,
                    bitisSaati: body.bitis_saati,

                    egitimSuresiDk: trainingData.durationMin,

                    egitimYeri: body.egitim_yeri,
                    icDisEgitim: body.ic_dis_egitim,
                    sonucBelgesiTuru: body.sonuc_belgesi_turu,
                    egitimDetayliAciklama: body.egitim_detayli_aciklama || null,

                    veriGirenSicil: session.sicilNo,
                    veriGirenAdSoyad: session.fullName,

                    year,
                    month,
                }).returning();

                results.success_count++;
                batchLogDetails.push({ id: newRecord.id, sicil: cleanSicil });

            } catch (err: any) {
                console.error(`Error processing sicil ${sicilNo}:`, err);
                results.error_count++;
                results.errors.push(`${sicilNo}: Beklenmeyen hata`);
            }
        }

        // Log batch result if any success
        if (results.success_count > 0) {
            await logAction({
                userId: session.userId,
                userRole: "CHEF",
                actionType: "CREATE",
                entityType: "attendance",
                entityId: `BATCH-${Date.now()}`, // Fake ID for batch
                newValue: {
                    count: results.success_count,
                    training: trainingData.code,
                    records: batchLogDetails
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: `${results.success_count} kayıt başarıyla oluşturuldu.`,
            data: results,
        });

    } catch (error) {
        console.error("Attendance batch create error:", error);
        return NextResponse.json(
            { success: false, message: "Beklenmeyen bir hata oluştu" },
            { status: 500 }
        );
    }
}

// PUT - Katılım kaydı güncelle (Inline editing için genişletilmiş)
export async function PUT(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        // Sadece ADMIN düzenleyebilir
        if (session.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Bu işlem için yetkiniz yok" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { id, field, value } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID gerekli" },
                { status: 400 }
            );
        }

        if (!field) {
            return NextResponse.json(
                { success: false, message: "Field gerekli" },
                { status: 400 }
            );
        }

        // Mevcut kaydı bul
        const existingRecord = await db.query.attendances.findFirst({
            where: eq(attendances.id, id),
        });

        if (!existingRecord) {
            return NextResponse.json(
                { success: false, message: "Kayıt bulunamadı" },
                { status: 404 }
            );
        }

        // Güncellenecek alanları map et
        const updateData: any = {};
        let needsYearMonthUpdate = false;

        switch (field) {
            case 'baslama_tarihi':
                updateData.baslamaTarihi = value;
                needsYearMonthUpdate = true;
                break;
            case 'bitis_tarihi':
                updateData.bitisTarihi = value;
                break;
            case 'baslama_saati':
                updateData.baslamaSaati = value;
                break;
            case 'bitis_saati':
                updateData.bitisSaati = value;
                break;
            case 'egitim_yeri':
                updateData.egitimYeri = value;
                break;
            case 'egitim_detayli_aciklama':
                updateData.egitimDetayliAciklama = value || null;
                break;
            case 'egitim_kodu':
                updateData.egitimKodu = value;
                break;
            case 'egitim_alt_basligi':
                updateData.egitimAltBasligi = value || null;
                break;
            case 'egitmen_adi':
                // Eğitmen adı trainer tablosundan geliyor, snapshot olarak kaydediliyor
                updateData.egitmenAdi = value;
                break;
            case 'sonuc_belgesi_turu':
                if (value === 'EGITIM_KATILIM_CIZELGESI' || value === 'SERTIFIKA') {
                    updateData.sonucBelgesiTuru = value;
                }
                break;
            case 'ic_dis_egitim':
                if (value === 'IC' || value === 'DIS') {
                    updateData.icDisEgitim = value;
                }
                break;
            case 'egitim_suresi_dk':
                const duration = parseInt(value);
                if (!isNaN(duration) && duration > 0) {
                    updateData.egitimSuresiDk = duration;
                }
                break;
            case 'personel_durumu':
                if (['CALISAN', 'AYRILDI', 'IZINLI', 'PASIF'].includes(value)) {
                    updateData.personelDurumu = value;
                }
                break;
            case 'ad_soyad':
                updateData.adSoyad = value;
                break;
            case 'gorevi':
                updateData.gorevi = value;
                break;
            case 'proje_adi':
                updateData.projeAdi = value;
                break;
            case 'grup':
                updateData.grup = value;
                break;
            default:
                return NextResponse.json(
                    { success: false, message: "Geçersiz alan" },
                    { status: 400 }
                );
        }

        // Year ve month'u başlangıç tarihinden hesapla (eğer başlama tarihi güncelleniyorsa)
        if (needsYearMonthUpdate && updateData.baslamaTarihi) {
            const dateObj = new Date(updateData.baslamaTarihi);
            updateData.year = dateObj.getFullYear();
            updateData.month = dateObj.getMonth() + 1;
        }

        // Güncelle
        const [updated] = await db.update(attendances)
            .set(updateData)
            .where(eq(attendances.id, id))
            .returning();

        // Audit Log
        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "UPDATE",
            entityType: "attendance",
            entityId: id,
            oldValue: existingRecord,
            newValue: updated,
        });

        return NextResponse.json({
            success: true,
            message: "Kayıt başarıyla güncellendi",
            data: updated,
        });

    } catch (error) {
        console.error("Attendance update error:", error);
        return NextResponse.json(
            { success: false, message: "Güncelleme işlemi başarısız" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        // Sadece ADMIN silebilir
        if (session.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Bu işlem için yetkiniz yok" },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Silmek için ID gerekli" },
                { status: 400 }
            );
        }

        // Önce kaydı bul (audit için)
        const existingRecord = await db.query.attendances.findFirst({
            where: eq(attendances.id, id),
        });

        if (!existingRecord) {
            return NextResponse.json(
                { success: false, message: "Kayıt bulunamadı" },
                { status: 404 }
            );
        }

        // Sil
        await db.delete(attendances).where(eq(attendances.id, id));

        // Audit Log
        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "DELETE",
            entityType: "attendance",
            entityId: id,
            oldValue: existingRecord,
        });

        return NextResponse.json({
            success: true,
            message: "Katılım kaydı silindi",
        });

    } catch (error) {
        console.error("Attendance delete error:", error);
        return NextResponse.json(
            { success: false, message: "Silme işlemi başarısız" },
            { status: 500 }
        );
    }
}
