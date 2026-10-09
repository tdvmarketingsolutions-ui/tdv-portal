import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// A warm, editorial serif for display type on the public landing page only —
// deliberately distinct from Epilogue/Inter (the app chrome's pairing, see
// CLAUDE.md), chosen to read as considered and hand-crafted rather than a
// generic SaaS template. Scoped to this file; the rest of the app is
// untouched.
const serif = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], style: ["normal"] });

const pillBase =
  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] transition-colors";
const pillPrimary = `${pillBase} bg-ink text-canvas hover:bg-ink/90 dark:bg-ink-dark dark:text-canvas-dark dark:hover:bg-ink-dark/90`;
const pillSecondary = `${pillBase} border border-ink/15 text-ink hover:border-ink/35 dark:border-ink-dark/20 dark:text-ink-dark dark:hover:border-ink-dark/40`;

export const metadata: Metadata = {
  title: "TDV Portaal — Premium klantenportaal voor marketingbureaus",
  description:
    "Eén overzichtelijke, volledig gebrande plek voor projecten, content, feedback en bestanden met je klanten. Gebouwd voor marketingbureaus, freelancers en agency-startups.",
};

const FEATURES = [
  {
    title: "Projecten & aanvragen",
    description: "Status, tijdlijn en opmerkingen per project — je klant hoeft nooit te mailen voor een update.",
  },
  {
    title: "Contentplanning",
    description: "Kalender- en lijstweergave, goedkeuring per post, meerdere kanalen tegelijk.",
  },
  {
    title: "Feedback & opleveringen",
    description: "Versiehistoriek met reacties rechtstreeks op het beeld — geen eindeloze e-mailthreads meer.",
  },
  {
    title: "Bestanden met mappen",
    description: "Geneste mappen, slepen tussen mappen, alles overzichtelijk per klant.",
  },
  {
    title: "AI-assistent",
    description: "Je klant krijgt meteen antwoord op vragen over hun eigen projecten, dag en nacht.",
  },
  {
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
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-border px-4 py-6 sm:px-8 dark:border-border-dark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.png" alt="TDV Marketing Solutions" className="h-6 w-auto sm:h-7" />
        <nav className="hidden items-center gap-8 text-xs font-medium uppercase tracking-[0.15em] text-ink-muted md:flex dark:text-ink-dark-muted">
          <a href="#functies" className="hover:text-ink dark:hover:text-ink-dark">
            Functies
          </a>
          <a href="#prijzen" className="hover:text-ink dark:hover:text-ink-dark">
            Prijzen
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className={pillSecondary}>
            Inloggen
          </Link>
          <Link href="/register" className={pillPrimary}>
            Start proefperiode
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-ink-muted dark:text-ink-dark-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-accent-dark" aria-hidden />
          Voor marketingbureaus, freelancers &amp; agency-startups
        </p>
        <h1
          className={`${serif.className} mt-8 max-w-3xl text-5xl leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-7xl dark:text-ink-dark`}
        >
          Een klantenportaal dat oogt alsof je het zelf liet bouwen
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-muted dark:text-ink-dark-muted">
          Projecten, content, feedback en bestanden op één overzichtelijke plek — volledig in jouw huisstijl, met
          beveiligde toegang per klant.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/register" className={pillPrimary}>
            Start gratis proefperiode
          </Link>
          <Link href="/login" className={pillSecondary}>
            Ik heb al een account
          </Link>
        </div>
        <p className="mt-5 text-sm text-ink-muted dark:text-ink-dark-muted">
          14 dagen gratis uitproberen — geen creditcard nodig.
        </p>
      </section>

      <section id="functies" className="border-t border-border px-4 py-24 sm:px-8 sm:py-32 dark:border-border-dark">
        <div className="mx-auto max-w-5xl">
          <h2 className={`${serif.className} max-w-xl text-3xl tracking-tight text-ink sm:text-4xl dark:text-ink-dark`}>
            Alles wat je bureau nodig heeft
          </h2>
          <div className="mt-16 grid gap-x-12 gap-y-14 sm:grid-cols-2">
            {FEATURES.map(({ title, description }, i) => (
              <div key={title} className="border-t border-border pt-6 dark:border-border-dark">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-accent dark:text-accent-dark">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className={`${serif.className} mt-3 text-xl text-ink dark:text-ink-dark`}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-ink-dark-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="prijzen" className="border-t border-border px-4 py-24 sm:px-8 sm:py-32 dark:border-border-dark">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl">
            <h2 className={`${serif.className} text-3xl tracking-tight text-ink sm:text-4xl dark:text-ink-dark`}>
              Eenvoudige, eerlijke prijzen
            </h2>
            <p className="mt-3 text-ink-muted dark:text-ink-dark-muted">
              Maandelijks opzegbaar. Begin met een gratis proefperiode van 14 dagen, geen verplichtingen.
            </p>
          </div>

          <div className="mt-16 grid gap-10 border-t border-border pt-10 sm:grid-cols-3 sm:gap-12 dark:border-border-dark">
            {PLANS.map((plan) => (
              <div key={plan.name} className="flex flex-col">
                {plan.featured ? (
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-accent dark:text-accent-dark">
                    Meest gekozen
                  </p>
                ) : (
                  <div className="h-4" aria-hidden />
                )}
                <h3 className={`${serif.className} mt-2 text-2xl text-ink dark:text-ink-dark`}>{plan.name}</h3>
                <p className={`${serif.className} mt-4 text-4xl text-ink dark:text-ink-dark`}>
                  €{plan.price}
                  <span className="font-sans text-sm font-normal text-ink-muted dark:text-ink-dark-muted"> / maand</span>
                </p>
                <p className="mt-3 text-sm text-ink-muted dark:text-ink-dark-muted">{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-ink dark:text-ink-dark">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-accent dark:text-accent-dark" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-8 w-full ${plan.featured ? pillPrimary : pillSecondary}`}>
                  Start gratis proefperiode
                </Link>
              </div>
            ))}
          </div>
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
