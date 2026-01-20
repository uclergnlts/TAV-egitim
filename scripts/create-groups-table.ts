/**
 * personnel_groups tablosunu oluştur ve varsayılan grupları ekle
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

async function createGroupsTable() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    console.log("Veritabanına bağlanılıyor...");

    try {
        // Tablo var mı kontrol et
        const checkTable = await client.execute(`
            SELECT name FROM sqlite_master WHERE type='table' AND name='personnel_groups'
        `);

        if (checkTable.rows.length === 0) {
            console.log("personnel_groups tablosu oluşturuluyor...");

            await client.execute(`
                CREATE TABLE personnel_groups (
                    id text PRIMARY KEY NOT NULL,
                    name text NOT NULL,
                    description text,
                    is_active integer DEFAULT 1 NOT NULL,
                    created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            `);

            console.log("✓ Tablo oluşturuldu");
        } else {
            console.log("✓ Tablo zaten mevcut");
        }

        // Varsayılan grupları ekle
        const defaultGroups = [
            { name: "A", description: "A Grubu" },
            { name: "B", description: "B Grubu" },
            { name: "C", description: "C Grubu" },
            { name: "D", description: "D Grubu" },
            { name: "Genel", description: "Genel Personel" },
        ];

        for (const group of defaultGroups) {
            // Grup var mı kontrol et
            const existing = await client.execute({
                sql: "SELECT id FROM personnel_groups WHERE name = ?",
                args: [group.name]
            });

            if (existing.rows.length === 0) {
                const id = crypto.randomUUID();
                await client.execute({
                    sql: "INSERT INTO personnel_groups (id, name, description) VALUES (?, ?, ?)",
                    args: [id, group.name, group.description]
                });
                console.log(`✓ Grup eklendi: ${group.name}`);
            } else {
                console.log(`- Grup zaten var: ${group.name}`);
            }
        }

        console.log("\n✅ İşlem tamamlandı!");

    } catch (error) {
        console.error("Hata:", error);
    }

    client.close();
}

createGroupsTable();
