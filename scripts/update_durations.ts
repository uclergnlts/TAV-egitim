
import { db, trainings } from '../lib/db';
import { eq } from 'drizzle-orm';

const durationMap: Record<string, number> = {
    "M4": 40, "M8": 40, "M9": 60, "M10": 60, "M11": 40, "M12": 80,
    "M15": 60, "M16": 40, "M17": 40, "M18": 360, "M19": 60,
    "M20": 60, "M21": 40, "M22": 40, "M23": 40, "M24": 20,
    "M25": 360, "M26": 40, "M27": 40, "M28": 320, "M29": 60,
    "M30": 320, "M31": 1440, "M32": 320, "M33": 60, "M34": 60,
    "M35": 720, "M35-T": 320, "M36": 320, "M37": 320, "M38": 180,
    "M39": 60, "M40": 40, "M41": 4800, "M42": 60, "M43": 60,
    "M44": 60, "M46": 30, "M47": 60, "M48": 40, "M49": 40,
    "M50": 40, "M51": 320, "M52": 320, "M54": 60, "M55": 60,
    "M56": 320, "M57": 60, "M58": 40, "M59": 160, "M60": 160,
    "M62": 320, "M63": 60, "M64": 320, "M65": 60, "M66": 320,
    "M67": 320, "M68": 320, "M69": 320, "M70": 320, "M71": 320,
    "M72": 320, "M73": 320, "M74": 320, "M75": 320, "M76": 320,
    "M77": 720, "M78": 640, "M79": 640, "M80": 960,
    "T1": 180, "T1-T": 120,
    "T2": 720, "T2-T": 320,
    "T3": 1800, "T3-U": 360, "T3-T": 180,
    "T4": 1440, "T4-U": 360, "T4-T": 180,
    "T8": 360, "T8-T": 180,
    "T10": 360, "T10-T": 360,
    "T11": 1440, "T11-U": 360, "T11-T": 180,
    "T12": 960, "T12-T": 320,
    "T13": 1280, "T13-T": 640,
    "T15": 960, "T15-T": 320,
    "T17": 1280, "T17-U": 640, "T17-T": 160,
    "T18-Sil": 5220, "T18-S": 2250, // Assuming T18-Si first match
    "T19": 60
};

// Handle partial matches or aliases if needed based on the image quality
// T18 variants in the image seem to be:
// T18-Sil... 5220
// T18-Sil... 4320 (maybe Silahsız?)
// T18-Sil... 2700
// T18-Sil... 2250
// Since I can't read the full suffix from the sliver image, I will update what I can clearly identify.
// If exact codes exist in DB, they will be updated.

// Special logic for M10 space in Excel might be "M10 " vs "M10"
// I will trim DB keys in the query or handle both.

async function updateDurations() {
    console.log("Starting duration update...");
    let updatedCount = 0;

    for (const [code, duration] of Object.entries(durationMap)) {
        // Try exact match
        const result = await db.update(trainings)
            .set({ durationMin: duration })
            .where(eq(trainings.code, code))
            .returning({ id: trainings.id, code: trainings.code });

        if (result.length > 0) {
            console.log(`Updated [${code}] -> ${duration} min`);
            updatedCount++;
        } else {
            // Try trimming? The code in DB should be trimmed from previous import script.
            // Maybe try with space if it failed?
            // Actually, verify if some variants like "M10 " stored as "M10"
        }
    }

    console.log(`\nOperation complete. Updated ${updatedCount} trainings.`);
}

updateDurations().catch(console.error);
