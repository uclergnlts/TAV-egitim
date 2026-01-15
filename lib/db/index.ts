/**
 * Database connection - Turso LibSQL
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Check for required environment variables
const dbUrl = process.env.TURSO_DATABASE_URL;

// Create client only if URL is defined (avoid build errors during static generation)
const client = createClient({
    url: dbUrl || "file:local.db", // Fallback for build phase
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export * from "./schema";
