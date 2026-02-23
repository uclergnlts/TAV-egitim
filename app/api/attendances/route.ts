/**
 * Katılım Kayıt API (Batch)
 * POST /api/attendances - Yeni katılım kayıtları oluştur (ŞEF)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, attendances, personnel, trainings, trainingTopics, trainers } from "@/lib/db";
import { eq, and, inArray, ne } from "drizzle-orm";
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

        const batchLogDetails: Array<{ id: string; sicil: string }> = [];

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
                if (!personelData.tcKimlikNo?.trim()) {
                    results.error_count++;
                    results.errors.push(`${cleanSicil}: Personel TC Kimlik No eksik`);
                    continue;
                }
                if (!personelData.grup?.trim()) {
                    results.error_count++;
                    results.errors.push(`${cleanSicil}: Personel Çalışma Grubu eksik`);
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
                    yerlesim: null,
                    organizasyon: null,
                    sirketAdi: null,
                    gorevi: personelData.gorevi,
                    vardiyaTipi: null,
                    projeAdi: personelData.projeAdi,
                    grup: personelData.grup,
                    terminal: null,
                    bolgeKodu: null,
                    personelDurumu: personelData.personelDurumu,

                    egitimKodu: trainingData.code,
                    egitimKoduYeni: trainingData.code,
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
                    egitimTestSonucu: null,
                    tazelemePlanlamaTarihi: null,

                    veriGirenSicil: session.sicilNo,
                    veriGirenAdSoyad: session.fullName,
                    veriGirisTarihi: new Date().toISOString(),

                    year,
                    month,
                }).returning();

                results.success_count++;
                batchLogDetails.push({ id: newRecord.id, sicil: cleanSicil });

            } catch {
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

    } catch {
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

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID gerekli" },
                { status: 400 }
            );
        }

        const existingRecord = await db.query.attendances.findFirst({
            where: eq(attendances.id, id),
        });

        if (!existingRecord) {
            return NextResponse.json(
                { success: false, message: "Kayıt bulunamadı" },
                { status: 404 }
            );
        }

        if (session.role !== "ADMIN" && existingRecord.veriGirenSicil !== session.sicilNo) {
            return NextResponse.json(
                { success: false, message: "Bu kaydı düzenleme yetkiniz yok" },
                { status: 403 }
            );
        }

        const { field, value } = body;
        const valueStr = typeof value === "string" ? value.trim() : String(value ?? "").trim();

        if (!field) {
            return NextResponse.json(
                { success: false, message: "Field gerekli" },
                { status: 400 }
            );
        }

        const updateData: Record<string, string | number | null> = {};
        let needsYearMonthUpdate = false;

        switch (field) {
            case "sicil_no": {
                if (!valueStr) {
                    return NextResponse.json({ success: false, message: "Sicil No boş bırakılamaz" }, { status: 400 });
                }
                const personelBySicil = await db.query.personnel.findFirst({ where: eq(personnel.sicilNo, valueStr) });
                if (!personelBySicil) {
                    return NextResponse.json({ success: false, message: "Sicil No bulunamadı: " + valueStr }, { status: 400 });
                }
                updateData.personelId = personelBySicil.id;
                updateData.sicilNo = personelBySicil.sicilNo;
                updateData.adSoyad = personelBySicil.fullName;
                updateData.tcKimlikNo = personelBySicil.tcKimlikNo;
                updateData.gorevi = personelBySicil.gorevi;
                updateData.projeAdi = personelBySicil.projeAdi;
                updateData.grup = personelBySicil.grup;
                updateData.personelDurumu = personelBySicil.personelDurumu;
                break;
            }
            case "baslama_tarihi":
                if (!/^\d{4}-\d{2}-\d{2}$/.test(valueStr)) {
                    return NextResponse.json({ success: false, message: "Başlama tarihi formatı geçersiz (YYYY-MM-DD)" }, { status: 400 });
                }
                updateData.baslamaTarihi = valueStr;
                needsYearMonthUpdate = true;
                break;
            case "bitis_tarihi":
                if (!/^\d{4}-\d{2}-\d{2}$/.test(valueStr)) {
                    return NextResponse.json({ success: false, message: "Bitiş tarihi formatı geçersiz (YYYY-MM-DD)" }, { status: 400 });
                }
                updateData.bitisTarihi = valueStr;
                break;
            case "baslama_saati":
                if (!/^\d{2}:\d{2}$/.test(valueStr)) {
                    return NextResponse.json({ success: false, message: "Başlama saati formatı geçersiz (HH:mm)" }, { status: 400 });
                }
                updateData.baslamaSaati = valueStr;
                break;
            case "bitis_saati":
                if (!/^\d{2}:\d{2}$/.test(valueStr)) {
                    return NextResponse.json({ success: false, message: "Bitiş saati formatı geçersiz (HH:mm)" }, { status: 400 });
                }
                updateData.bitisSaati = valueStr;
                break;
            case "egitim_yeri":
                if (!valueStr) {
                    return NextResponse.json({ success: false, message: "Eğitim yeri boş bırakılamaz" }, { status: 400 });
                }
                updateData.egitimYeri = valueStr;
                break;
            case "egitim_detayli_aciklama":
                updateData.egitimDetayliAciklama = valueStr || null;
                break;
            case "egitim_kodu": {
                if (!valueStr) {
                    return NextResponse.json({ success: false, message: "Eğitim kodu boş bırakılamaz" }, { status: 400 });
                }
                const trainingByCode = await db.query.trainings.findFirst({ where: eq(trainings.code, valueStr) });
                if (!trainingByCode) {
                    return NextResponse.json({ success: false, message: "Eğitim kodu bulunamadı: " + valueStr }, { status: 400 });
                }
                updateData.trainingId = trainingByCode.id;
                updateData.egitimKodu = trainingByCode.code;
                updateData.egitimKoduYeni = trainingByCode.code;
                updateData.egitimSuresiDk = trainingByCode.durationMin;
                updateData.egitimAltBasligi = null;
                break;
            }
            case "egitim_alt_basligi": {
                if (!valueStr) {
                    updateData.egitimAltBasligi = null;
                    break;
                }

                const targetTrainingId = existingRecord.trainingId;
                const topic = await db.query.trainingTopics.findFirst({
                    where: and(
                        eq(trainingTopics.trainingId, targetTrainingId),
                        eq(trainingTopics.title, valueStr)
                    ),
                });

                if (!topic) {
                    return NextResponse.json(
                        { success: false, message: "Seçilen alt eğitim, seçili eğitim koduna bağlı değil" },
                        { status: 400 }
                    );
                }

                updateData.egitimAltBasligi = valueStr;
                break;
            }
            case "egitmen_adi": {
                if (!valueStr) {
                    updateData.trainerId = null;
                    break;
                }
                const trainerByName = await db.query.trainers.findFirst({ where: eq(trainers.fullName, valueStr) });
                if (!trainerByName) {
                    return NextResponse.json({ success: false, message: "Eğitmen bulunamadı" }, { status: 400 });
                }
                updateData.trainerId = trainerByName.id;
                break;
            }
            case "trainer_id": {
                if (!valueStr) {
                    updateData.trainerId = null;
                    break;
                }
                const trainerById = await db.query.trainers.findFirst({ where: eq(trainers.id, valueStr) });
                if (!trainerById) {
                    return NextResponse.json({ success: false, message: "Eğitmen bulunamadı" }, { status: 400 });
                }
                updateData.trainerId = trainerById.id;
                break;
            }
            case "sonuc_belgesi_turu":
                if (valueStr !== "EGITIM_KATILIM_CIZELGESI" && valueStr !== "SERTIFIKA") {
                    return NextResponse.json({ success: false, message: "Geçersiz sonuç belgesi türü" }, { status: 400 });
                }
                updateData.sonucBelgesiTuru = valueStr;
                break;
            case "ic_dis_egitim":
                if (valueStr !== "IC" && valueStr !== "DIS") {
                    return NextResponse.json({ success: false, message: "Geçersiz iç/dış eğitim değeri" }, { status: 400 });
                }
                updateData.icDisEgitim = valueStr;
                break;
            case "egitim_suresi_dk": {
                const duration = parseInt(valueStr, 10);
                if (!Number.isFinite(duration) || duration <= 0) {
                    return NextResponse.json({ success: false, message: "Eğitim süresi geçersiz" }, { status: 400 });
                }
                updateData.egitimSuresiDk = duration;
                break;
            }
            case "personel_durumu":
                if (!["CALISAN", "AYRILDI", "IZINLI", "PASIF"].includes(valueStr)) {
                    return NextResponse.json({ success: false, message: "Geçersiz personel durumu" }, { status: 400 });
                }
                updateData.personelDurumu = valueStr;
                break;
            case "ad_soyad":
                if (!valueStr) return NextResponse.json({ success: false, message: "Ad Soyad boş bırakılamaz" }, { status: 400 });
                updateData.adSoyad = valueStr;
                break;
            case "gorevi":
                if (!valueStr) return NextResponse.json({ success: false, message: "Görev boş bırakılamaz" }, { status: 400 });
                updateData.gorevi = valueStr;
                break;
            case "tc_kimlik_no":
                if (!valueStr) return NextResponse.json({ success: false, message: "TC Kimlik No boş bırakılamaz" }, { status: 400 });
                updateData.tcKimlikNo = valueStr;
                break;
            case "proje_adi":
                if (!valueStr) return NextResponse.json({ success: false, message: "Proje adı boş bırakılamaz" }, { status: 400 });
                updateData.projeAdi = valueStr;
                break;
            case "grup":
                if (!valueStr) return NextResponse.json({ success: false, message: "Çalışma Grubu boş bırakılamaz" }, { status: 400 });
                updateData.grup = valueStr;
                break;
            case "yerlesim":
                updateData.yerlesim = valueStr || null;
                break;
            case "organizasyon":
                updateData.organizasyon = valueStr || null;
                break;
            case "sirket_adi":
                updateData.sirketAdi = valueStr || null;
                break;
            case "vardiya_tipi":
                updateData.vardiyaTipi = valueStr || null;
                break;
            case "terminal":
                updateData.terminal = valueStr || null;
                break;
            case "bolge_kodu":
                updateData.bolgeKodu = valueStr || null;
                break;
            case "egitim_kodu_yeni":
                updateData.egitimKoduYeni = valueStr || null;
                break;
            case "egitim_test_sonucu":
                updateData.egitimTestSonucu = valueStr || null;
                break;
            case "tazeleme_planlama_tarihi":
                if (valueStr && !/^\d{4}-\d{2}-\d{2}$/.test(valueStr)) {
                    return NextResponse.json({ success: false, message: "Tazeleme planlama tarihi formatı geçersiz (YYYY-MM-DD)" }, { status: 400 });
                }
                updateData.tazelemePlanlamaTarihi = valueStr || null;
                break;
            case "veri_giren_sicil":
                if (!valueStr) return NextResponse.json({ success: false, message: "Veri giren sicil boş bırakılamaz" }, { status: 400 });
                updateData.veriGirenSicil = valueStr;
                break;
            case "veri_giris_tarihi":
                if (!valueStr) return NextResponse.json({ success: false, message: "Veri giriş tarihi boş bırakılamaz" }, { status: 400 });
                updateData.veriGirisTarihi = valueStr;
                break;
            default:
                return NextResponse.json(
                    { success: false, message: "Geçersiz alan" },
                    { status: 400 }
                );
        }

        if (needsYearMonthUpdate && updateData.baslamaTarihi) {
            const dateStr = String(updateData.baslamaTarihi);
            const [yearStr, monthStr] = dateStr.split("-");
            updateData.year = parseInt(yearStr, 10);
            updateData.month = parseInt(monthStr, 10);
            if (!Number.isFinite(updateData.year) || !Number.isFinite(updateData.month)) {
                return NextResponse.json({ success: false, message: "Başlama tarihi geçersiz" }, { status: 400 });
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, message: "Güncellenecek geçerli alan bulunamadı" }, { status: 400 });
        }

        const targetPersonelId = String(updateData.personelId ?? existingRecord.personelId);
        const targetTrainingId = String(updateData.trainingId ?? existingRecord.trainingId);
        const targetYear = Number(updateData.year ?? existingRecord.year);

        const conflictRecord = await db.query.attendances.findFirst({
            where: and(
                eq(attendances.personelId, targetPersonelId),
                eq(attendances.trainingId, targetTrainingId),
                eq(attendances.year, targetYear),
                ne(attendances.id, id)
            ),
        });

        if (conflictRecord) {
            return NextResponse.json(
                { success: false, message: "Aynı personel/eğitim/yıl için zaten bir kayıt var" },
                { status: 409 }
            );
        }

        const [updated] = await db.update(attendances)
            .set(updateData)
            .where(eq(attendances.id, id))
            .returning();

        await logAction({
            userId: session.userId,
            userRole: session.role as "ADMIN" | "CHEF",
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

    } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message?.includes("UNIQUE")) {
            return NextResponse.json(
                { success: false, message: "Bu güncelleme benzersiz kayıt kuralını ihlal ediyor" },
                { status: 409 }
            );
        }
        if (err.message?.includes("NOT NULL")) {
            return NextResponse.json(
                { success: false, message: "Zorunlu bir alan boş bırakıldı" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, message: "Güncelleme işlemi başarısız" },
            { status: 500 }
        );
    }
}

// Bulk Delete - Toplu silme
export async function PATCH(request: NextRequest) {
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

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: "Silmek için ID listesi gerekli" },
                { status: 400 }
            );
        }

        // Kayıtları bul (audit için)
        const existingRecords = await db.query.attendances.findMany({
            where: inArray(attendances.id, ids),
        });

        if (existingRecords.length === 0) {
            return NextResponse.json(
                { success: false, message: "Kayıtlar bulunamadı" },
                { status: 404 }
            );
        }

        // Toplu sil
        await db.delete(attendances).where(inArray(attendances.id, ids));

        // Audit Log
        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "DELETE",
            entityType: "attendance",
            entityId: `BULK-${Date.now()}`,
            oldValue: { count: existingRecords.length, records: existingRecords.map(r => ({ id: r.id, sicil: r.sicilNo })) },
        });

        return NextResponse.json({
            success: true,
            message: `${existingRecords.length} kayıt silindi`,
            deletedCount: existingRecords.length,
        });

    } catch {
        return NextResponse.json(
            { success: false, message: "Toplu silme işlemi başarısız" },
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

        // Yetki kontrolü: ADMIN veya kaydı giren şef silebilir
        if (session.role !== "ADMIN" && existingRecord.veriGirenSicil !== session.sicilNo) {
            return NextResponse.json(
                { success: false, message: "Bu kaydı silme yetkiniz yok" },
                { status: 403 }
            );
        }

        // Sil
        await db.delete(attendances).where(eq(attendances.id, id));

        // Audit Log
        await logAction({
            userId: session.userId,
            userRole: session.role,
            actionType: "DELETE",
            entityType: "attendance",
            entityId: id,
            oldValue: existingRecord,
        });

        return NextResponse.json({
            success: true,
            message: "Katılım kaydı silindi",
        });

    } catch {
        return NextResponse.json(
            { success: false, message: "Silme işlemi başarısız" },
            { status: 500 }
        );
    }
}
