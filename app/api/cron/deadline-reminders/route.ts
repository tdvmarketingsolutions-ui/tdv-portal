import { NextResponse } from "next/server";
import { sendDeadlineRemindersAsCronJob } from "@/lib/data/admin/deadline-reminders";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Vercel Cron target (see `crons` in vercel.json) — same bearer-token
 * pattern as /api/cron/ai-ingest: Vercel sends `Authorization: Bearer
 * ${CRON_SECRET}` on scheduled invocations, so a request without a matching
 * header is rejected outright.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendDeadlineRemindersAsCronJob();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Cron deadline-herinneringen mislukt:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Herinneringen mislukt." }, { status: 500 });
  }
}
