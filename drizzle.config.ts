import { defineConfig } from "drizzle-kit";
import { existsSync } from "fs";

// Load environment variables natively in Node.js 20.6+
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required to run Drizzle migrations."
  );
}

export default defineConfig({
  // Dialect — PostgreSQL (compatible with Supabase, Neon, Railway, etc.)
  dialect: "postgresql",

  // Connection string — read from environment, never hardcoded
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },

  // Schema — modular table definitions by domain
  schema: "./src/server/schema",

  // Migration output directory
  out: "./drizzle",

  // Print all SQL statements during push/migrate for audit visibility
  verbose: true,

  // Strict mode — warns on destructive changes (column drops, renames)
  strict: true,
});
