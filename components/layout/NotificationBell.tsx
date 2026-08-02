"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell({ userId, initialUnreadCount }: { userId: string; initialUnreadCount: number }) {
  const [count, setCount] = useState(initialUnreadCount);

  useEffect(() => {
    const supabase = createClient();

    function refreshCount() {
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .is("read_at", null)
        .then(({ count: c }) => setCount(c ?? 0));
    }

    // A unique-per-mount topic name (rather than reusing `notifications:${userId}`)
    // avoids a React Strict Mode dev-mode crash: Strict Mode mounts, cleans up,
    // and remounts effects synchronously, and Supabase's realtime client caches
    // channel objects by topic name — reusing the same name means the second
    // mount's `.channel()` call returns the already-`subscribe()`d instance from
    // the first mount, and calling `.on()` on it then throws.
    const channel = supabase
      .channel(`notifications:${userId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        refreshCount
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `Meldingen, ${count} ongelezen` : "Meldingen"}
      className="relative rounded-lg p-2 text-ink-muted transition-colors hover:bg-canvas hover:text-ink dark:text-ink-dark-muted dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
    >
      <Bell size={18} strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-semibold leading-none text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
