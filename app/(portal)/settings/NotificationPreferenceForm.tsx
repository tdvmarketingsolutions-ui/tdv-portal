"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { updateEmailNotificationPrefAction } from "./actions";

export function NotificationPreferenceForm({ emailNotifications }: { emailNotifications: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [checked, setChecked] = useState(emailNotifications);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked;
    setChecked(next);
    setLoading(true);
    const result = await updateEmailNotificationPrefAction(next);
    setLoading(false);

    if (result.error) {
      setChecked(!next);
      push(result.error, "error");
      return;
    }
    router.refresh();
  }

  return (
    <label className="flex items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={loading}
        className="h-4 w-4 rounded border-border text-accent focus:ring-accent disabled:opacity-60 dark:border-border-dark"
      />
      E-mail me bij nieuwe meldingen (nieuwe ticketberichten, content die goedkeuring nodig heeft)
    </label>
  );
}
