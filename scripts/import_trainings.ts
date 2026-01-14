
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { db, trainings, trainingTopics } from '../lib/db';
import { eq } from 'drizzle-orm';

interface TrainingData {
    code: string;
    name: string;
    duration: number;
    topics: string[];
}

async function importTrainings() {
    const filePath = path.join(process.cwd(), 'doc', 'eĞİTİMLER.xlsx');

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    console.log("Reading Excel file...");
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    // Skip header row (index 0)
    const rows = data.slice(1);

    console.log(`Found ${rows.length} rows. Grouping data...`);

    // Group by Training Code, filtering out totally empty rows
    const trainingsMap = new Map<string, TrainingData>();

    for (const row of rows) {
        // Ensure row has at least some data
        if (!row || row.length === 0) continue;

        const name = row[1]?.toString().trim();
        const code = row[2]?.toString().trim();
        const topic = row[3]?.toString().trim();
        const duration = parseInt(row[5]);

        // Key requirement: Must have a code to be a training
        if (!code) continue;

        if (!trainingsMap.has(code)) {
            trainingsMap.set(code, {
                code,
                name: name || "Bilinmeyen Eğitim", // Fallback if name is missing in first row but present later
                duration: isNaN(duration) ? 60 : duration,
                topics: []
            });
        }

        const currentData = trainingsMap.get(code)!;

        // If later rows have better name or duration information, update it
        if (name && currentData.name === "Bilinmeyen Eğitim") {
            currentData.name = name;
        }
        if (!isNaN(duration) && duration > 0) {
            currentData.duration = duration;
        }

        if (topic) {
            // Split by comma if multiple topics in one cell
            const subTopics = topic.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);

            subTopics.forEach((st: string) => {
                // Avoid strict duplicates
                if (!currentData.topics.includes(st)) {
                    currentData.topics.push(st);
                }
            });
        }
    }

    console.log(`Identified ${trainingsMap.size} unique trainings. Syncing to DB...`);

    let successCount = 0;
    let errorCount = 0;

    for (const [code, data] of trainingsMap.entries()) {
        try {
            console.log(`Processing [${code}] ${data.name}`);

            // 1. Upsert Training
            const existingTraining = await db.select().from(trainings).where(eq(trainings.code, code)).execute();
            let trainingId: string;

            if (existingTraining.length > 0) {
                trainingId = existingTraining[0].id;
                await db.update(trainings)
                    .set({
                        name: data.name,
                        durationMin: data.duration,
                        isActive: true
                    })
                    .where(eq(trainings.id, trainingId));
            } else {
                const [newTraining] = await db.insert(trainings).values({
                    code: code,
                    name: data.name,
                    durationMin: data.duration,
                    category: "TEMEL",
                    isActive: true
                }).returning();
                trainingId = newTraining.id;
            }

            // 2. Sync Topics
            // Always delete existing to ensure clean state based on Excel
            await db.delete(trainingTopics).where(eq(trainingTopics.trainingId, trainingId));

            if (data.topics.length > 0) {
                console.log(`  -> Syncing ${data.topics.length} topics...`);

                let orderNo = 1;
                for (const topicTitle of data.topics) {
                    await db.insert(trainingTopics).values({
                        trainingId: trainingId,
                        title: topicTitle,
                        orderNo: orderNo++,
                        isActive: true
                    });
                }
            } else {
                console.log(`  -> No topics found.`);
            }

            successCount++;

        } catch (error) {
            console.error(`Error processing [${code}]:`, error);
            errorCount++;
        }
    }

    console.log(`\nImport completed.`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

importTrainings().catch(console.error);
