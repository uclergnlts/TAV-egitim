
import { db, trainingLocations, documentTypes } from "@/lib/db";

async function main() {
    console.log("🌱 Seeding Definitions...");

    // Locations
    const locations = [
        "Cihaz Başı",
        "Diğer",
        "Dış Kurum",
        "Eğitim Kurumu",
        "İç Hatlar Konferans Salonu",
        "TAV Akademi Salonları"
    ];

    for (const name of locations) {
        await db.insert(trainingLocations).values({ name }).onConflictDoNothing();
    }

    // Documents
    const documents = [
        "Sertifika",
        "Eğitim Katılım Çizelgesi",
        "Katılım Belgesi",
        "Diğer"
    ];

    for (const name of documents) {
        await db.insert(documentTypes).values({ name }).onConflictDoNothing();
    }

    console.log("✅ Definitions seeded!");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
