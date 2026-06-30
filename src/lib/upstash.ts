/**
 * Upstash clients — Undangin.studio
 *
 * Exports:
 *  - `redis`     — Upstash Redis client for caching, rate limiting, sessions.
 *  - `qstash`    — QStash client for publishing messages/workflows.
 *
 * Both clients are SERVER-SIDE ONLY.
 * Tokens are NOT prefixed with NEXT_PUBLIC_ and must never reach the browser.
 */
import { Redis } from "@upstash/redis";
import { Client as QStashClient } from "@upstash/qstash";
import { Client as WorkflowClient } from "@upstash/workflow";

// ---------------------------------------------------------------------------
// Upstash Redis
// ---------------------------------------------------------------------------
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error(
    "[Undangin.studio] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set."
  );
}

/**
 * Redis client — use for:
 *  - Caching (invitation metadata, template lists)
 *  - Rate limiting (API route protection)
 *  - Session token storage
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ---------------------------------------------------------------------------
// Upstash QStash — Serverless Message Queue / Workflow Orchestration
// ---------------------------------------------------------------------------
if (!process.env.QSTASH_TOKEN) {
  throw new Error(
    "[Undangin.studio] QSTASH_TOKEN must be set for workflow/queue operations."
  );
}

/**
 * QStash client — use for:
 *  - Publishing WhatsApp blast jobs
 *  - Scheduling delayed notifications
 *  - Triggering multi-step workflows
 */
export const qstash = new QStashClient({
  token: process.env.QSTASH_TOKEN,
});

/**
 * Workflow client — use for triggering multi-step workflow blasts.
 */
export const workflowClient = new WorkflowClient({
  token: process.env.QSTASH_TOKEN,
});

