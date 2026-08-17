"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";

/**
 * Mounted once per authenticated layout (portal + admin). Subscribes to
 * Postgres changes on `notifications` for the current user (see migration
 * 0013 — the table has to be added to the supabase_realtime publication
 * before this fires at all) and refreshes the current route so the
 * server-rendered unread badge / notification list pick up the change,
 * instead of requiring a manual reload.
 */
export function RealtimeNotifications({ userId }: { userId: string }) {
  const router = useRouter();
  const { push } = useToast();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        (payload) => {
          const title = (payload.new as { title?: string }).title;
          push(title ?? "Nieuwe melding");
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, router, push]);

  return null;
}
