import { NextResponse } from "next/server";
import { sendContentScheduleRemindersAsCronJob } from "@/lib/data/admin/content-schedule-reminders";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Vercel Cron target (see `crons` in vercel.json) — same bearer-token
 * pattern as the other two crons.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendContentScheduleRemindersAsCronJob();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Cron planningscontrole content mislukt:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Controle mislukt." }, { status: 500 });
  }
}
