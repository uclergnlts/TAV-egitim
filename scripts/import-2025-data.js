/**
 * 2025 Eğitim Verisi Import Scripti (JSON Kaynaklı)
 * excel-data.json dosyasından veritabanına veri aktarımı
 * 
 * Kullanım: node scripts/import-2025-data.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');
const { drizzle } = require('drizzle-orm/libsql');
const { eq, and, sql } = require('drizzle-orm');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseExcelDate(dateNum) {
    if (!dateNum) return null;
    const str = dateNum.toString().padStart(7, '0');
    // Format: DMMYYYY or DDMMYYYY
    let day, month, year;

    if (str.length === 7) {
        day = str.substring(0, 1);
        month = str.substring(1, 3);
        year = str.substring(3, 7);
    } else if (str.length === 8) {
        day = str.substring(0, 2);
        month = str.substring(2, 4);
        year = str.substring(4, 8);
    } else {
        // Fallback - try to parse as ddMMyyyy
        day = str.substring(0, 2);
        month = str.substring(2, 4);
        year = str.substring(4);
    }

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseExcelTime(timeNum) {
    if (timeNum === null || timeNum === undefined) return '09:00';
    const str = timeNum.toString().padStart(4, '0');
    const hours = str.substring(0, 2);
    const minutes = str.substring(2, 4);
    return `${hours}:${minutes}`;
}

function parsePersonelDurumu(durum) {
    if (!durum) return 'CALISAN';
    const lower = durum.toString().toLowerCase().trim();
    if (lower.includes('ayrıl')) return 'AYRILDI';
    if (lower.includes('izin')) return 'IZINLI';
    if (lower.includes('pasif')) return 'PASIF';
    return 'CALISAN';
}

function parseIcDisEgitim(value) {
    if (!value) return 'IC';
    const lower = value.toString().toLowerCase();
    if (lower.includes('dış') || lower.includes('dis')) return 'DIS';
    return 'IC';
}

function parseSonucBelgesi(value) {
    if (!value) return 'EGITIM_KATILIM_CIZELGESI';
    const lower = value.toString().toLowerCase();
    if (lower.includes('sertifika')) return 'SERTIFIKA';
    return 'EGITIM_KATILIM_CIZELGESI';
}

function parseEgitmenSicil(value) {
    if (!value) return null;
    const match = value.toString().match(/^(\d+)/);
    return match ? match[1] : null;
}

function parseEgitmenAd(value) {
    if (!value) return null;
    const parts = value.toString().split(/\s+/);
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
        return parts.slice(1).join(' ');
    }
    return value.toString();
}

// =============================================================================
// MAIN IMPORT FUNCTION
// =============================================================================

async function importData() {
    console.log('🚀 2025 Eğitim Verisi Import (JSON) Başlıyor...\n');

    // Database connection
    const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;
    const client = createClient({ url, ...(authToken ? { authToken } : {}) });

    // Read JSON file
    const rootDir = path.join(__dirname, '..');
    const jsonPath = path.join(rootDir, 'excel-data.json');

    if (!fs.existsSync(jsonPath)) {
        console.error('❌ JSON dosyası bulunamadı:', jsonPath);
        process.exit(1);
    }

    console.log(`📂 JSON dosyası okunuyor: excel-data.json`);
    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // "Sayfa1" sheetini al
    if (!rawData['Sayfa1'] || !rawData['Sayfa1'].data) {
        console.error('❌ Sayfa1 verisi bulunamadı!');
        process.exit(1);
    }

    const dataRows = rawData['Sayfa1'].data;
    console.log(`📊 Toplam satır: ${dataRows.length}\n`);

    // Stats
    const stats = {
        personnelCreated: 0,
        personnelSkipped: 0,
        trainingsCreated: 0,
        trainersCreated: 0,
        attendancesCreated: 0,
        attendancesSkipped: 0,
        errors: []
    };

    // Cache for existing records
    const personnelCache = new Map();
    const trainingsCache = new Map();
    const trainersCache = new Map();

    // =============================================================================
    // STEP 1: Collect unique personnel, trainings, trainers
    // =============================================================================
    console.log('📋 Adım 1: Benzersiz kayıtlar toplanıyor...');

    const uniquePersonnel = new Map();
    const uniqueTrainings = new Map();
    const uniqueTrainers = new Map();

    // Key mappings based on JSON structure
    const KEYS = {
        SICIL_NO: 'Sicil No',
        AD_SOYAD: 'Adı Soyadı ', // Notice the space
        TC_NO: 'Tc Kimlik No',
        GOREVI: 'Görevi',
        PROJE: 'Proje Adi',
        GRUP: 'Calisma Grubu',
        DURUM: 'Personel Durumu',
        EGITIM_KODU: 'Egitim Kodu (Yeni)',
        EGITIM_ACIKLAMA: 'Egitim Detay Açıklama (Yeni)',
        EGITIM_SURE: 'Egitim Suresi',
        EGITMEN: 'Eğitmen Adı',
        BAS_TARIH: 'Egt Bas Trh',
        BIT_TARIH: 'Egt Bit Trh',
        BAS_SAAT: 'Egitim Baslama Saati',
        BIT_SAAT: 'Egitim Bitis Saati',
        YER: 'Egitimin Yeri',
        IC_DIS: 'Ic Dis Egitim',
        SONUC: 'Sonuc Belgesi'
    };

    for (const row of dataRows) {
        const sicilNo = row[KEYS.SICIL_NO]?.toString().trim();
        const egitimKodu = row[KEYS.EGITIM_KODU]?.toString().trim();
        const egitmenStr = row[KEYS.EGITMEN];

        if (sicilNo && !uniquePersonnel.has(sicilNo)) {
            uniquePersonnel.set(sicilNo, {
                sicilNo,
                fullName: row[KEYS.AD_SOYAD]?.toString().trim() || '',
                tcKimlikNo: row[KEYS.TC_NO]?.toString().trim() || '',
                gorevi: row[KEYS.GOREVI]?.toString().trim() || 'Güvenlik Görevlisi',
                projeAdi: row[KEYS.PROJE]?.toString().trim() || 'TAV ESB',
                grup: row[KEYS.GRUP]?.toString().trim() || 'A',
                personelDurumu: parsePersonelDurumu(row[KEYS.DURUM])
            });
        }

        if (egitimKodu && !uniqueTrainings.has(egitimKodu)) {
            uniqueTrainings.set(egitimKodu, {
                code: egitimKodu,
                name: row[KEYS.EGITIM_ACIKLAMA]?.toString().trim() || egitimKodu,
                durationMin: parseInt(row[KEYS.EGITIM_SURE]) || 40
            });
        }

        if (egitmenStr) {
            const egitmenSicil = parseEgitmenSicil(egitmenStr);
            const egitmenAd = parseEgitmenAd(egitmenStr);
            if (egitmenSicil && !uniqueTrainers.has(egitmenSicil)) {
                uniqueTrainers.set(egitmenSicil, {
                    sicilNo: egitmenSicil,
                    fullName: egitmenAd || 'Bilinmeyen Eğitmen'
                });
            }
        }
    }

    console.log(`   Benzersiz personel: ${uniquePersonnel.size}`);
    console.log(`   Benzersiz eğitim: ${uniqueTrainings.size}`);
    console.log(`   Benzersiz eğitmen: ${uniqueTrainers.size}\n`);

    // =============================================================================
    // STEP 2: Insert/Update Personnel
    // =============================================================================
    console.log('👥 Adım 2: Personel kaydediliyor...');

    for (const [sicilNo, p] of uniquePersonnel) {
        try {
            const existing = await client.execute({
                sql: 'SELECT id FROM personnel WHERE sicil_no = ?',
                args: [sicilNo]
            });

            if (existing.rows.length > 0) {
                personnelCache.set(sicilNo, existing.rows[0].id);
                // Eğer isim boşsa güncelle (temizlik yapıldı ama ne olur ne olmaz)
                if (p.fullName && p.fullName !== '') {
                    await client.execute({
                        sql: 'UPDATE personnel SET full_name = ? WHERE id = ?',
                        args: [p.fullName, existing.rows[0].id]
                    });
                }
                stats.personnelSkipped++;
            } else {
                const id = crypto.randomUUID();
                await client.execute({
                    sql: `INSERT INTO personnel (id, sicil_no, full_name, tc_kimlik_no, gorevi, proje_adi, grup, personel_durumu) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [id, p.sicilNo, p.fullName, p.tcKimlikNo, p.gorevi, p.projeAdi, p.grup, p.personelDurumu]
                });
                personnelCache.set(sicilNo, id);
                stats.personnelCreated++;
            }
        } catch (err) {
            stats.errors.push(`Personel ${sicilNo}: ${err.message}`);
        }
    }

    console.log(`   ✅ İşlendi: ${stats.personnelCreated + stats.personnelSkipped}\n`);

    // =============================================================================
    // STEP 3: Insert/Update Trainings
    // =============================================================================
    console.log('📚 Adım 3: Eğitimler kaydediliyor...');

    for (const [code, t] of uniqueTrainings) {
        try {
            const existing = await client.execute({
                sql: 'SELECT id FROM trainings WHERE code = ?',
                args: [code]
            });

            if (existing.rows.length > 0) {
                trainingsCache.set(code, existing.rows[0].id);
            } else {
                const id = crypto.randomUUID();
                await client.execute({
                    sql: `INSERT INTO trainings (id, code, name, duration_min, category, is_active) 
                          VALUES (?, ?, ?, ?, 'TAZELEME', 1)`,
                    args: [id, t.code, t.name, t.durationMin]
                });
                trainingsCache.set(code, id);
                stats.trainingsCreated++;
            }
        } catch (err) {
            stats.errors.push(`Eğitim ${code}: ${err.message}`);
        }
    }

    console.log(`   ✅ Yeni eğitim: ${stats.trainingsCreated}\n`);

    // =============================================================================
    // STEP 4: Insert/Update Trainers
    // =============================================================================
    console.log('🎓 Adım 4: Eğitmenler kaydediliyor...');

    for (const [sicilNo, t] of uniqueTrainers) {
        try {
            const existing = await client.execute({
                sql: 'SELECT id FROM trainers WHERE sicil_no = ?',
                args: [sicilNo]
            });

            if (existing.rows.length > 0) {
                trainersCache.set(sicilNo, existing.rows[0].id);
            } else {
                const id = crypto.randomUUID();
                await client.execute({
                    sql: `INSERT INTO trainers (id, sicil_no, full_name, is_active) 
                          VALUES (?, ?, ?, 1)`,
                    args: [id, sicilNo, t.fullName]
                });
                trainersCache.set(sicilNo, id);
                stats.trainersCreated++;
            }
        } catch (err) {
            stats.errors.push(`Eğitmen ${sicilNo}: ${err.message}`);
        }
    }

    console.log(`   ✅ Yeni eğitmen: ${stats.trainersCreated}\n`);

    // =============================================================================
    // STEP 5: Insert Attendances
    // =============================================================================
    console.log('📝 Adım 5: Eğitim kayıtları ekleniyor...');

    let processedCount = 0;

    for (const row of dataRows) {
        processedCount++;
        if (processedCount % 1000 === 0) {
            console.log(`   İşlenen: ${processedCount}/${dataRows.length}`);
        }

        try {
            const sicilNo = row[KEYS.SICIL_NO]?.toString().trim();
            const egitimKodu = row[KEYS.EGITIM_KODU]?.toString().trim();

            if (!sicilNo || !egitimKodu) continue;

            const personelId = personnelCache.get(sicilNo);
            const trainingId = trainingsCache.get(egitimKodu);

            if (!personelId || !trainingId) continue;

            const baslamaTarihi = parseExcelDate(row[KEYS.BAS_TARIH]);
            const bitisTarihi = parseExcelDate(row[KEYS.BIT_TARIH]) || baslamaTarihi;

            if (!baslamaTarihi) continue;

            const year = parseInt(baslamaTarihi.substring(0, 4));
            const month = parseInt(baslamaTarihi.substring(5, 7));

            // Check duplicate
            const existing = await client.execute({
                sql: 'SELECT id FROM attendances WHERE personel_id = ? AND training_id = ? AND year = ?',
                args: [personelId, trainingId, year]
            });

            if (existing.rows.length > 0) {
                stats.attendancesSkipped++;
                continue;
            }

            // Get trainer ID
            const egitmenSicil = parseEgitmenSicil(row[KEYS.EGITMEN]);
            const trainerId = egitmenSicil ? trainersCache.get(egitmenSicil) : null;

            // Personnel data
            const p = uniquePersonnel.get(sicilNo);

            // Check fullName again just in case
            if (!p.fullName) {
                // Try from row again
                p.fullName = row[KEYS.AD_SOYAD]?.toString().trim() || 'İsimsiz';
            }

            const id = crypto.randomUUID();
            await client.execute({
                sql: `INSERT INTO attendances (
                    id, personel_id, training_id, trainer_id,
                    sicil_no, ad_soyad, tc_kimlik_no, gorevi, proje_adi, grup, personel_durumu,
                    egitim_kodu, baslama_tarihi, bitis_tarihi, baslama_saati, bitis_saati,
                    egitim_suresi_dk, egitim_yeri, ic_dis_egitim, sonuc_belgesi_turu,
                    egitim_detayli_aciklama, veri_giren_sicil, veri_giren_ad_soyad, year, month
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    id, personelId, trainingId, trainerId,
                    sicilNo, p.fullName, p.tcKimlikNo, p.gorevi, p.projeAdi, p.grup, p.personelDurumu,
                    egitimKodu, baslamaTarihi, bitisTarihi,
                    parseExcelTime(row[KEYS.BAS_SAAT]),
                    parseExcelTime(row[KEYS.BIT_SAAT]),
                    parseInt(row[KEYS.EGITIM_SURE]) || 40,
                    row[KEYS.YER]?.toString().trim() || 'Bilinmiyor',
                    parseIcDisEgitim(row[KEYS.IC_DIS]),
                    parseSonucBelgesi(row[KEYS.SONUC]),
                    row[KEYS.EGITIM_ACIKLAMA]?.toString().trim() || null,
                    'IMPORT (JSON)', 'Toplu Import',
                    year, month
                ]
            });

            stats.attendancesCreated++;

        } catch (err) {
            stats.errors.push(`Satır ${processedCount}: ${err.message}`);
        }
    }

    // =============================================================================
    // SUMMARY
    // =============================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SONUÇLARI');
    console.log('='.repeat(60));
    console.log(`👥 Personel       : ${stats.personnelCreated} yeni, ${stats.personnelSkipped} mevcut/güncellendi`);
    console.log(`📚 Eğitimler      : ${stats.trainingsCreated} yeni`);
    console.log(`🎓 Eğitmenler     : ${stats.trainersCreated} yeni`);
    console.log(`📝 Eğitim Kayıtları: ${stats.attendancesCreated} yeni, ${stats.attendancesSkipped} atlandı`);

    if (stats.errors.length > 0) {
        console.log(`\n⚠️ Hatalar (ilk 10):`);
        stats.errors.slice(0, 10).forEach(e => console.log(`   - ${e}`));
    }

    console.log('\n✅ Import tamamlandı!');
}

importData().catch(err => {
    console.error('❌ Import hatası:', err);
    process.exit(1);
});

