
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("🛠️ Creating Definition Tables Manually...");

    // Create training_locations
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS training_locations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log("training_locations created.");

    // Create document_types
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS document_types (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log("document_types created.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
