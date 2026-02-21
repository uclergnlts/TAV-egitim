/**
 * Temizlik Scripti
 * Hatalı import edilen (ismi boş olan) kayıtları siler.
 */

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function clean() {
    console.log('🧹 Temizlik başlıyor...');

    const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;

    const client = createClient({ url, ...(authToken ? { authToken } : {}) });

    // 1. İsmi boş olan attendances sil
    const attResult = await client.execute(`
        DELETE FROM attendances 
        WHERE ad_soyad = '' OR ad_soyad IS NULL
    `);
    console.log(`🗑️  Silinen boş isimli attendance sayısı: ${attResult.rowsAffected}`);

    // 2. İsmi boş olan personnel sil
    // Dikkat: İlişkili attendance kayıtları varsa hata verebilir, ama yukarıda sildik.
    // Yine de constraint hatası almamak için try/catch
    try {
        const perResult = await client.execute(`
            DELETE FROM personnel 
            WHERE full_name = '' OR full_name IS NULL
        `);
        console.log(`🗑️  Silinen boş isimli personel sayısı: ${perResult.rowsAffected}`);
    } catch (e) {
        console.error('⚠️ Personel silinirken hata:', e.message);
    }

    console.log('✅ Temizlik tamamlandı.');
}

clean();


