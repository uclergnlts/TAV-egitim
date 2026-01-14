
import { db } from "@/lib/db";
import { personnel } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function count() {
    const result = await db.select({ count: sql<number>`count(*)` }).from(personnel);
    console.log(`📊 Toplam Personel Sayısı: ${result[0].count}`);
}

count();
