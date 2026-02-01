/**
 * Veritabanı Bağlantısı - Turso LibSQL
 * Drizzle ORM ile SQLite bağlantısı
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Çevre değişkeninden veritabanı URL'si
const dbUrl = process.env.TURSO_DATABASE_URL;

// LibSQL client oluştur (build aşamasında hata vermemesi için fallback)
const client = createClient({
    url: dbUrl || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Drizzle ORM instance'ı
export const db = drizzle(client, { schema });

// Schema export'ları
export * from "./schema";
