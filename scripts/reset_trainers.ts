
import { db, trainers, attendances } from "../lib/db";

async function main() {
    console.log("Resetting trainers...");

    try {
        // First, check if any attendances are linked to trainers
        // For safety/cleanup, we can set trainerId to null for those attendances 
        // OR just try deleting and see if it fails.
        // Given 'reset' instruction, cleaning up references is safer.

        console.log("Nullifying trainer references in attendances...");
        await db.update(attendances).set({ trainerId: null }).all(); // Update all to remove link

        console.log("Deleting all trainers...");
        await db.delete(trainers).all();

        console.log("Trainers table cleared successfully.");
    } catch (error) {
        console.error("Error resetting trainers:", error);
        process.exit(1);
    }
}

main();
