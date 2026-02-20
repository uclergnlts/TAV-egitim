import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
    throw new Error("TURSO_DATABASE_URL environment variable is required.");
}

export default defineConfig({
    schema: "./lib/db/schema.ts",
    out: "./drizzle",
    dialect: "turso",
    dbCredentials: {
        url: tursoUrl,
        ...(tursoAuthToken ? { authToken: tursoAuthToken } : {}),
    },
});
