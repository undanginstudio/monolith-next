/**
 * Drizzle ORM Database Client — Undangin.studio V1.1
 *
 * SERVER-SIDE ONLY. Import only from:
 *  - src/features/[domain]/services/
 *  - src/features/[domain]/actions/ (use server)
 *  - src/app/api/ route handlers
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as authSchema from "@/server/schema/auth";
import * as templatesSchema from "@/server/schema/templates";
import * as ordersSchema from "@/server/schema/orders";
import * as invitationsSchema from "@/server/schema/invitations";
import * as analyticsSchema from "@/server/schema/analytics";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "[Undangin.studio] DATABASE_URL is required. Check your .env.local file."
  );
}

const client = postgres(process.env.DATABASE_URL, {
  max: 1,             // Serverless-safe: 1 connection per invocation
  ssl: "require",
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, {
  schema: {
    ...authSchema,
    ...templatesSchema,
    ...ordersSchema,
    ...invitationsSchema,
    ...analyticsSchema,
  },
});

// Re-export schemas for convenient query usage
export {
  authSchema,
  templatesSchema,
  ordersSchema,
  invitationsSchema,
  analyticsSchema,
};
