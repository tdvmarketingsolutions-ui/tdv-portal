import { Bell } from "lucide-react";
import { getNotificationsForCurrentUser } from "@/lib/data/notifications";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationList } from "./NotificationList";
import { MarkAllReadButton } from "./MarkAllReadButton";

export default async function NotificationsPage() {
  const notifications = await getNotificationsForCurrentUser();
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Meldingen</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            Updates over tickets, opmerkingen, goedkeuringen en meer.
          </p>
        </div>
        {hasUnread && <MarkAllReadButton />}
      </header>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Geen meldingen" description="Zodra er iets gebeurt, zie je het hier." />
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  );
}
