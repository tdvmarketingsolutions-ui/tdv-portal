import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-h2 font-semibold sm:text-h1">instellingen.</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Beheer je account en voorkeuren.</p>
      </header>
      {/* account, wachtwoord, weergave, meldingsvoorkeuren */}
      {["h-[280px]", "h-[220px]", "h-[132px]", "h-[120px]"].map((height) => (
        <Skeleton key={height} className={`${height} w-full`} />
      ))}
    </div>
  );
}
