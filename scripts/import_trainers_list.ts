
import { db, trainers } from "../lib/db";
import fs from "fs";
import path from "path";

// Load .env manually
try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
        const file = fs.readFileSync(envPath, "utf-8");
        file.split("\n").forEach(line => {
            const [key, value] = line.trim().split("=");
            if (key && value) process.env[key] = value;
        });
    }
} catch (e) { console.error("Could not load .env", e); }

const rawData = `
35021 Fatih Uslu
200013 Erdal Kaynak
35208 Ali Bostan
35087 Yılmaz İdrisoğlu
35200 Adil Kaya
9024 Turgay Şahan
35111 Derya Baykal
111117 Azize Akpınar
35122 Erçin Akın
35307 Murat Nergiz
106301 Güldan Kolay
116296 Bekir Bağatır
112252 Cemile Komi Uçak
106800 Demet Azder
141175-Abdullah Oğulcan Tosun
116147 Oktay Yavaş
35359 Şenol Çıtlak
100188 Serkan Özdemir
101528 Serpil Körpe
0942 Özgüç Kaya
100407 Kadriye Öztürk
129790 Zeynep Sezen Atik
105426 Şehriban Deniz
35448 Murat Keskin
35293 Mehmet İkyaz
35052 Gül Özcan
35444 Gülay Gül
35223 Caner Akın
35085 Ramazan Dönmez
106277 Serpil Köprücü
137872 Ömer HORAT
113078 Melda Çakır
120292 Yusuf Güler
35459 Hacı Arslan İnaltun
106751 Nesimi Erpak
114566 Mikail Öztürk
141933 Mehmet Yıldız
107007 Muammer Öncel
102068 Yılmaz Ölüç
8916 Birsen Sıra
8939 Gül Horat
35294 Mehmet Öztürk
100590 Yahya Büyükaslan
35003 Recep Boz
8914 Önder Akbaş
115760 Emin Yaşar Arslan
14273 Gökhan Sevinç
35140 GÜLAY ÇELİK
35148 HATİCE PEKMEZCI
141176 A.Oğulcan TOSUN
000000 Tan Dumlupınar
0006 AYSEL KARABIYIKOĞLU
000001 Ferhat Kuzucan
000002 Alper Şentürk
000003 Abdullah Keleş
000004 Osman Tilkioğlu
128442 Cüneyt Güneş
128445 Erdoğan Şener
128451 Koral Kalaycı
128456 Salih Cinoğlu
128484 Fatih Teoman
128489 Mustafa Akyüz
128493 Ferdi Onar
128496 Halim Kopar
128490 Nizamettin Türkili
128502 Okan Yetiş
128506 Zeki Akıllı
128662 Ümit Bark
7217 Türker AKSU
7837 Kuzey AKSOY
102662 Burcu ÇOBAN
0000 Feza KATI
0034 Recep TAYFUN
0034 Merve Elif ŞAHNE
0034 Başak Durcuk
113444 ÖZLEM ÇAĞLAR
104560 KEMAL SÖNMEZ
109412 SELDA EFE
107588 RUKIYE AKMAN
104562 ALPER KANGALCI
100837 İRFAN EMECEN
110861 NESRİN KOCABAŞ
109413 COŞKUN ÇAĞLAR
101412 MURAT KORUK
109110 DİLEK YEŞİLKILINÇ
0000 Can DEMİRAĞ
0000 Can ÇELİKAY
0000 Mehmet SEVİNDİK
153284 HAKAN KILIÇASLAN
153279 ADEM ARSLANOĞLU
`;

// Helper cleanup function:
// Splits line into sicil and name.
// Handle "141175-Abdullah" -> "141175", "Abdullah..."
function parseLine(line: string) {
    line = line.trim();
    if (!line) return null;

    // Split by first space
    // Check if it has '-' separating number and name
    let sicil = "";
    let name = "";

    const parts = line.split(/\s+/);
    if (parts.length < 2) return null; // Needs at least sicil and name

    const potentialSicil = parts[0];

    if (potentialSicil.includes("-")) {
        // Case: 141175-Abdullah
        const subParts = potentialSicil.split("-");
        sicil = subParts[0];
        // Name is the rest of parts + possibly subParts[1]
        if (subParts[1]) {
            // E.g. "123-Ahmet Yilmaz" -> split by space might have been "123-Ahmet", "Yilmaz"
            // Reconstruct:
            // Actually simpler: Match leading digits/chars until space or inside -
            // Let's use regex.
        }
    }

    // Better regex approach: Start with digits, maybe chars? Sicils seem to be digits mostly.
    // Some sicils are "0000", "0942".
    // Regex: ^(\d+)\s+(.+)$  OR ^(\d+)-(.+)$

    const match = line.match(/^(\d+)[-\s]+(.+)$/); // Match digits, then - or space(s), then rest is name
    if (match) {
        return {
            sicil: match[1],
            fullName: match[2].trim()
        };
    }

    // Fallback?
    return null;
}

async function main() {
    console.log("Importing trainers from raw list...");
    const lines = rawData.split("\n");
    let count = 0;

    for (const line of lines) {
        const parsed = parseLine(line);
        if (!parsed) continue;

        try {
            await db.insert(trainers).values({
                sicilNo: parsed.sicil,
                fullName: parsed.fullName,
                isActive: true
            });
            console.log(`Added: ${parsed.sicil} - ${parsed.fullName}`);
            count++;
        } catch (e) {
            console.error(`Failed to add: ${line}`, e);
        }
    }
    console.log(`Import completed. Total added: ${count}`);
}

main();
