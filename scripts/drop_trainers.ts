
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Dropping trainers table...");
    try {
        await db.run(sql`DROP TABLE IF EXISTS trainers`);
        console.log("Trainers table dropped.");
    } catch (e) {
        console.error("Error dropping table:", e);
    }
}

main();
