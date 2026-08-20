"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { setStaffViewCompanyAction } from "@/app/(portal)/staff-view-actions";

export function StaffViewSwitcher({
  companies,
  currentCompanyId,
}: {
  companies: { id: string; name: string }[];
  currentCompanyId: string | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value || null;
    setLoading(true);
    const result = await setStaffViewCompanyAction(next);
    setLoading(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    router.refresh();
  }

  return (
    <div className="px-3 pb-1">
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-muted dark:text-ink-dark-muted">
        <Eye size={14} strokeWidth={1.75} />
        Bekijk als klant
      </label>
      <div className="relative">
        <select
          value={currentCompanyId ?? ""}
          onChange={handleChange}
          disabled={loading}
          className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-base outline-none focus:border-accent disabled:opacity-60 dark:border-border-dark dark:bg-surface-dark md:text-xs"
        >
          <option value="">Eigen weergave (alles)</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
