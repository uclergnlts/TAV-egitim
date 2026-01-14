
import { db, trainings } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

// Load env vars
dotenv.config();

async function main() {
    console.log("🔍 Starting Database Diagnostics...");
    console.log("Checking environment variables...");

    if (!process.env.TURSO_DATABASE_URL) {
        console.error("❌ TURSO_DATABASE_URL is missing!");
    } else {
        console.log("✅ TURSO_DATABASE_URL is present.");
    }

    const testCode = "TEST_" + Date.now();

    try {
        console.log(`\n📝 Attempting to insert test training with code: ${testCode}`);

        const [result] = await db.insert(trainings).values({
            code: testCode,
            name: "Diagnostic Test Training",
            durationMin: 30,
            category: "TEMEL",
            isActive: true
        }).returning();

        console.log("✅ Insert successful!", result);

        console.log("\n🔎 Verifying insertion by reading back...");
        const readBack = await db.select().from(trainings).where(eq(trainings.id, result.id)).get();

        if (readBack) {
            console.log("✅ Read back successful:", readBack);

            // Clean up
            console.log("\n🧹 Cleaning up test data...");
            await db.delete(trainings).where(eq(trainings.id, result.id));
            console.log("✅ Cleanup successful.");
        } else {
            console.error("❌ Read back failed! Data was inserted but could not be found.");
        }

    } catch (error) {
        console.error("\n❌ DIAGNOSTIC FAILED:", error);
    }
}

main();
