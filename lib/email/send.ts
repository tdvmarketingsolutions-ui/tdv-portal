import "server-only";

/**
 * Email provider — Resend's HTTP API, called directly via fetch (no SDK
 * dependency), same approach as the Anthropic and embeddings calls
 * elsewhere in this codebase. Swap the endpoint/payload below to switch
 * providers; EMAIL_PROVIDER_API_KEY / EMAIL_FROM_ADDRESS are already in
 * .env.example for exactly this.
 *
 * Best-effort by design, same reasoning as createNotifications() in
 * lib/data/notifications.ts: sending an email is always a side effect of
 * some other action and must never fail that action. Silently no-ops if
 * EMAIL_PROVIDER_API_KEY isn't configured, so this is safe to call from any
 * environment (including local dev without the key set).
 */
export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
  if (!process.env.EMAIL_PROVIDER_API_KEY) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EMAIL_PROVIDER_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM_ADDRESS ?? "notificaties@tdv.be",
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      console.error("Kon e-mail niet versturen:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Kon e-mail niet versturen:", err);
  }
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tdv-client-portal.vercel.app";
  return `${base.replace(/\/$/, "")}${path}`;
}
