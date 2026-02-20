/**
 * Veritabani Baglantisi - Turso LibSQL
 * Drizzle ORM ile Turso baglantisi
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const tursoUrl = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url: tursoUrl,
    ...(tursoAuthToken ? { authToken: tursoAuthToken } : {}),
});

// Drizzle ORM instance'i
export const db = drizzle(client, { schema });

// Schema exports
export * from "./schema";
