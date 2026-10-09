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
const pillPrimary = `${pillBase} bg-accent text-white hover:bg-accent/90 dark:bg-accent-dark dark:text-ink-dark dark:hover:bg-accent-dark/90`;
const pillOnDark = `${pillBase} bg-accent text-white hover:bg-accent/90`;
const textLink = "text-sm font-medium text-ink underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink dark:text-ink-dark dark:decoration-ink-dark/25 dark:hover:decoration-ink-dark";

export const metadata: Metadata = {
  title: "TDV Portaal: klantenportaal voor marketingbureaus",
  description:
    "Eén volledig gebrande plek voor projecten, content, feedback en bestanden met je klanten. Gebouwd voor marketingbureaus, freelancers en agency-startups.",
};

const FEATURES = [
  {
    title: "Projecten & aanvragen",
    description: "Status, tijdlijn en opmerkingen per project, zodat je klant nooit meer hoeft te mailen voor een update.",
  },
  {
    title: "Contentplanning",
    description: "Kalender- of lijstweergave, goedkeuring per post en meerdere kanalen tegelijk plannen.",
  },
  {
    title: "Feedback & opleveringen",
    description: "Versiehistoriek met reacties rechtstreeks op het beeld, zodat eindeloze e-mailthreads verleden tijd zijn.",
  },
  {
    title: "Bestanden met mappen",
    description: "Geneste mappen en slepen tussen mappen, net zo overzichtelijk als je klant gewend is.",
  },
  {
    title: "AI-assistent",
    description: "Je klant krijgt dag en nacht meteen antwoord op vragen over zijn eigen projecten.",
  },
  {
    title: "Eigen branding, beveiligd per klant",
    description: "Jouw logo, jouw kleuren. Dat elke klant enkel zijn eigen gegevens ziet, wordt afgedwongen in de database, niet enkel op het scherm.",
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
    description: "Voor gevestigde bureaus met veel klanten en een eigen team.",
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
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="TDV Marketing Solutions" className="h-6 w-auto sm:h-7" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-ink-muted md:flex dark:text-ink-dark-muted">
          <a href="#functies" className="hover:text-ink dark:hover:text-ink-dark">
            Functies
          </a>
          <a href="#prijzen" className="hover:text-ink dark:hover:text-ink-dark">
            Prijzen
          </a>
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/login" className={textLink}>
            Inloggen
          </Link>
          <Link href="/register" className={`${pillPrimary} px-4 py-2 text-[11px] sm:px-5 sm:py-2.5 sm:text-xs`}>
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Start proefperiode</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
        <h1
          className={`${serif.className} max-w-3xl text-4xl leading-[1.15] tracking-tight text-ink sm:text-6xl sm:leading-[1.1] lg:text-7xl dark:text-ink-dark`}
        >
          Een klantenportaal dat oogt alsof je het <span className="text-accent dark:text-accent-dark">zelf</span>{" "}
          liet bouwen
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-muted dark:text-ink-dark-muted">
          Jouw klanten krijgen hun eigen, volledig gebrande omgeving voor projecten, content, feedback en bestanden,
          met beveiligde toegang per klant. Gebouwd voor marketingbureaus, freelancers en agency-startups.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-6">
          <Link href="/register" className={pillPrimary}>
            Start gratis proefperiode
          </Link>
          <Link href="/login" className={textLink}>
            Ik heb al een account
          </Link>
        </div>
        <p className="mt-5 text-sm text-ink-muted dark:text-ink-dark-muted">
          14 dagen gratis uitproberen, geen creditcard nodig.
        </p>
      </section>

      <section id="functies" className="bg-accent-soft px-4 py-20 sm:px-8 sm:py-28 dark:bg-accent/10">
        <div className="mx-auto max-w-5xl">
          <h2 className={`${serif.className} max-w-xl text-3xl tracking-tight text-ink sm:text-4xl dark:text-ink-dark`}>
            Wat je klanten in hun portaal vinden
          </h2>
          <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {FEATURES.map(({ title, description }) => (
              <div key={title}>
                <h3 className={`${serif.className} text-xl text-ink dark:text-ink-dark`}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-ink-dark-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="prijzen" className="px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl">
            <h2 className={`${serif.className} text-3xl tracking-tight text-ink sm:text-4xl dark:text-ink-dark`}>
              Eenvoudige, eerlijke prijzen
            </h2>
            <p className="mt-3 text-ink-muted dark:text-ink-dark-muted">
              Maandelijks opzegbaar, zonder verplichtingen. Je begint met 14 dagen gratis.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.featured
                    ? "flex flex-col rounded-2xl bg-accent-soft p-7 dark:bg-accent/10"
                    : "flex flex-col p-7"
                }
              >
                <h3 className={`${serif.className} text-2xl text-ink dark:text-ink-dark`}>{plan.name}</h3>
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
                <Link
                  href="/register"
                  className={
                    plan.featured
                      ? `mt-8 w-full ${pillPrimary}`
                      : `mt-8 w-full border border-ink/15 ${pillBase} text-ink hover:border-ink/35 dark:border-ink-dark/20 dark:text-ink-dark dark:hover:border-ink-dark/40`
                  }
                >
                  Start gratis proefperiode
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink px-4 py-20 text-center sm:px-8 sm:py-28 dark:bg-ink-dark">
        <h2 className={`${serif.className} text-3xl text-canvas sm:text-4xl dark:text-canvas-dark`}>
          Klaar om je klanten hun eigen portaal te geven?
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <Link href="/register" className={pillOnDark}>
            Start gratis proefperiode
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-canvas underline decoration-canvas/30 underline-offset-4 hover:decoration-canvas dark:text-canvas-dark dark:decoration-canvas-dark/30"
          >
            Ik heb al een account
          </Link>
        </div>
      </section>

      <footer className="py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="TDV Marketing Solutions" className="h-5 w-auto opacity-70" />
          </Link>
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
