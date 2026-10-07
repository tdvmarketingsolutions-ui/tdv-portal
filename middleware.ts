import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - static files (_next/static, _next/image, favicon)
     * - the /api/webhooks route, which is authenticated by signature, not session
     * - the /api/cron routes, authenticated by a CRON_SECRET bearer header —
     *   Vercel Cron invocations carry no session cookie at all
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/cron).*)",
  ],
};
