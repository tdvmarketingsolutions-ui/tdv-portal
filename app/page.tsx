import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, FolderKanban, CalendarDays, MessageSquare, FileStack, Sparkles, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "TDV Portaal — Premium klantenportaal voor marketingbureaus",
  description:
    "Eén overzichtelijke, volledig gebrande plek voor projecten, content, feedback en bestanden met je klanten. Gebouwd voor marketingbureaus, freelancers en agency-startups.",
};

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Projecten & aanvragen",
    description: "Status, tijdlijn en opmerkingen per project — je klant hoeft nooit te mailen voor een update.",
  },
  {
    icon: CalendarDays,
    title: "Contentplanning",
    description: "Kalender- en lijstweergave, goedkeuring per post, meerdere kanalen tegelijk.",
  },
  {
    icon: MessageSquare,
    title: "Feedback & opleveringen",
    description: "Versiehistoriek met reacties rechtstreeks op het beeld — geen eindeloze e-mailthreads meer.",
  },
  {
    icon: FileStack,
    title: "Bestanden met mappen",
    description: "Geneste mappen, slepen tussen mappen, alles overzichtelijk per klant.",
  },
  {
    icon: Sparkles,
    title: "AI-assistent",
    description: "Je klant krijgt meteen antwoord op vragen over hun eigen projecten, dag en nacht.",
  },
  {
    icon: ShieldCheck,
    title: "Eigen branding, beveiligd per klant",
    description: "Jouw logo, jouw kleuren. Elke klant ziet enkel zijn eigen gegevens — database-afgedwongen, niet enkel in de interface.",
  },
] as const;

const PLANS = [
  {
    name: "Starter",
    price: "129",
    description: "Voor freelancers en kleine bureaus die net starten met een eigen klantenportaal.",
    features: ["Tot 5 klanten", "2 teamleden", "Projecten, aanvragen & bestanden", "Contentplanning"],
    featured: false,
  },
  {
    name: "Growth",
    price: "349",
    description: "Voor groeiende bureaus die feedback, goedkeuring en AI-ondersteuning willen meenemen.",
    features: [
      "Tot 20 klanten",
      "6 teamleden",
      "Alles uit Starter",
      "Feedback & opleveringen met versiehistoriek",
      "AI-assistent voor je klanten",
    ],
    featured: true,
  },
  {
    name: "Agency",
    price: "899",
    description: "Voor gevestigde bureaus met veel klanten en eigen team.",
    features: [
      "Onbeperkt klanten",
      "Onbeperkt teamleden",
      "Alles uit Growth",
      "Prioritaire ondersteuning",
      "Vroege toegang tot nieuwe functies",
    ],
    featured: false,
  },
] as const;

export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.png" alt="TDV Marketing Solutions" className="h-6 w-auto sm:h-7" />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="btn-secondary">
            Inloggen
          </Link>
          <Link href="/register" className="btn-primary">
            Start gratis proefperiode
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-8 sm:py-24">
        <p className="font-medium text-accent dark:text-accent-dark">
          Voor marketingbureaus, freelancers &amp; agency-startups
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Een premium klantenportaal, zonder het zelf te bouwen
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-muted dark:text-ink-dark-muted">
          Projecten, content, feedback en bestanden op één overzichtelijke plek — volledig in jouw huisstijl, met
          beveiligde toegang per klant. Zo oogt je bureau meteen net zo professioneel als de grootste spelers.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Start gratis proefperiode
          </Link>
          <Link href="/login" className="btn-secondary px-6 py-3 text-base">
            Ik heb al een account
          </Link>
        </div>
        <p className="mt-4 text-sm text-ink-muted dark:text-ink-dark-muted">
          14 dagen gratis uitproberen — geen creditcard nodig.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft dark:bg-accent/10">
                <Icon size={20} strokeWidth={1.75} className="text-accent dark:text-accent-dark" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted dark:text-ink-dark-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24" id="prijzen">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Eenvoudige, eerlijke prijzen</h2>
          <p className="mt-3 text-ink-muted dark:text-ink-dark-muted">
            Maandelijks opzegbaar. Begin met een gratis proefperiode van 14 dagen, geen verplichtingen.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`card relative flex flex-col p-6 ${plan.featured ? "ring-2 ring-accent dark:ring-accent-dark" : ""}`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
                  Meest gekozen
                </span>
              )}
              <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">{plan.description}</p>
              <p className="mt-5">
                <span className="font-display text-4xl font-semibold">€{plan.price}</span>
                <span className="text-sm text-ink-muted dark:text-ink-dark-muted"> / maand</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-accent dark:text-accent-dark" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-6 ${plan.featured ? "btn-primary" : "btn-secondary"}`}
              >
                Start gratis proefperiode
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 dark:border-border-dark">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="TDV Marketing Solutions" className="h-5 w-auto opacity-70" />
          <div className="flex items-center gap-4 text-sm text-ink-muted dark:text-ink-dark-muted">
            <Link href="/login" className="hover:text-ink dark:hover:text-ink-dark">
              Inloggen
            </Link>
            <span>© {new Date().getFullYear()} TDV Marketing Solutions</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
