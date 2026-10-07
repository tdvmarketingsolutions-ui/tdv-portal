import { NextResponse } from "next/server";
import { ingestKnowledgeBaseAsCronJob } from "@/lib/data/admin/ai-ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Vercel Cron target (see the `crons` entry in vercel.json) — the
 * "achtergrondtaak" half of the kennisbank-ingest TODO: runs on a schedule
 * instead of needing a staff member to click the button on /admin/ai.
 *
 * Authorization: Vercel automatically sends `Authorization: Bearer
 * ${CRON_SECRET}` on scheduled invocations once a CRON_SECRET env var is
 * set on the project — that's the only thing standing in for a session
 * here, so a request without a matching header is rejected outright. No
 * CRON_SECRET configured means this 401s on every call (fails closed, not
 * open) until that env var is added.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await ingestKnowledgeBaseAsCronJob();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Cron kennisbank-ingest mislukt:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ingest mislukt." }, { status: 500 });
  }
}
