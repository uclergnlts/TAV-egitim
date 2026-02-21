import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const dbUrl = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
    schema: "./lib/db/schema.ts",
    out: "./drizzle",
    dialect: "turso",
    dbCredentials: {
        url: dbUrl,
        ...(tursoAuthToken ? { authToken: tursoAuthToken } : {}),
    },
});
