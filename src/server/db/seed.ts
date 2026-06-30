import { existsSync } from "fs";

// ── 1. Load Environment Variables First ─────────────────────────────────────
// Must run before loading other files to prevent static import execution issues.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { users } from "../schema/auth";
import { eq } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "[Seeder] Error: DATABASE_URL is not set. Make sure .env.local has a valid database connection string."
    );
    process.exit(1);
  }

  console.log("[Seeder] Connecting to database...");
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  const email = "superadmin@undangin.studio";
  const password = "SuperAdminPassword123!";
  const name = "Super Admin Ganteng";

  console.log(`[Seeder] Hashing password for '${email}'...`);
  const passwordHash = await bcrypt.hash(password, 12);

  console.log("[Seeder] Checking for existing user records...");
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    console.log(`[Seeder] User already exists: ${email}`);
    // If exists, make sure it is active and role is superadmin
    await db
      .update(users)
      .set({ role: "superadmin", isActive: true })
      .where(eq(users.email, email));
    console.log("[Seeder] Existing user role and status verified.");
    await client.end();
    return;
  }

  console.log("[Seeder] Creating new superadmin record...");
  await db.insert(users).values({
    name,
    email,
    passwordHash,
    role: "superadmin",
    isActive: true,
  });

  console.log("\n[Seeder] ✅ Superadmin seeded successfully!");
  console.log("====================================================");
  console.log(`Nama     : ${name}`);
  console.log(`Email    : ${email}`);
  console.log(`Password : ${password}`);
  console.log(`Role     : superadmin`);
  console.log("====================================================");
  console.log("Gunakan akun ini untuk masuk ke dashboard portal.\n");

  await client.end();
}

main().catch((err) => {
  console.error("[Seeder] Fatal error during seeding:", err);
  process.exit(1);
});
