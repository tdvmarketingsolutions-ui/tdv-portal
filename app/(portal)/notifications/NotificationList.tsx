"use client";

import { useRouter } from "next/navigation";
import { NOTIFICATION_ICON } from "@/lib/notification-icon";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/domain";
import { markNotificationReadAction } from "./actions";

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();

  async function handleClick(notification: Notification) {
    if (!notification.read_at) {
      await markNotificationReadAction(notification.id);
    }
    if (notification.link_path) {
      router.push(notification.link_path);
    } else {
      router.refresh();
    }
  }

  return (
    <ul className="space-y-2">
      {notifications.map((notification) => {
        const Icon = NOTIFICATION_ICON[notification.type];
        const unread = !notification.read_at;
        return (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => handleClick(notification)}
              className={cn(
                "card flex w-full items-start gap-3 p-4 text-left transition-colors hover:shadow-md",
                unread && "bg-accent-soft/60 dark:bg-accent/10"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas dark:bg-canvas-dark">
                <Icon size={16} strokeWidth={1.75} className="text-ink-muted dark:text-ink-dark-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm", unread ? "font-semibold" : "font-medium")}>{notification.title}</p>
                  {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />}
                </div>
                {notification.body && (
                  <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-dark-muted">{notification.body}</p>
                )}
                <p className="mt-1 text-xs text-ink-muted dark:text-ink-dark-muted">
                  {new Date(notification.created_at).toLocaleString("nl-BE")}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
