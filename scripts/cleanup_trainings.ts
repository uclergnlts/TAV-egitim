
import { db, trainings } from "@/lib/db";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Cleaning up existing trainings (Soft Delete)...");

    try {
        await db.update(trainings).set({ isActive: false });
        console.log("All trainings have been marked as inactive.");
    } catch (error) {
        console.error("Error cleaning up trainings:", error);
    }

    process.exit(0);
}

main();
