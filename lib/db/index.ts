/**
 * Veritabani Baglantisi - Local SQLite (LibSQL)
 * Varsayilan: file:local.db
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const dbUrl = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url: dbUrl,
    ...(tursoAuthToken ? { authToken: tursoAuthToken } : {}),
});

// Drizzle ORM instance'i
export const db = drizzle(client, { schema });

// Schema exports
export * from "./schema";
