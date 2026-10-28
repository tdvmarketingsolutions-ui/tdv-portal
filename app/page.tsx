import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Check,
  ChevronDown,
  FolderKanban,
  CalendarDays,
  MessageSquareText,
  FolderTree,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/brand/Wordmark";

// Publieke landingspagina volgens de huisstijlrichtlijnen v1.1, sectie 4:
// altijd licht, beige grond, donkere tekst, terracotta enkel als accent.
// Inhoud bewust beperkt tot wat vaststaat: de prijzen en de proefperiode
// van 14 dagen zijn door Thomas bevestigd (zie README); er staan geen
// klantlogo's, cijfers of getuigenissen op die we niet kunnen aantonen.

export const metadata: Metadata = {
  title: "TDV Portaal: klantenportaal voor marketingbureaus",
  description:
    "Eén volledig gebrande plek voor projecten, content, feedback en bestanden met je klanten. Gebouwd voor marketingbureaus, freelancers en agency-startups.",
};

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Projecten en aanvragen",
    description: "Status, tijdlijn en opmerkingen per project, zodat je klant niet meer hoeft te mailen voor een update.",
  },
  {
    icon: CalendarDays,
    title: "Contentplanning",
    description: "Kalender- of lijstweergave, goedkeuring per post en meerdere kanalen tegelijk plannen.",
  },
  {
    icon: MessageSquareText,
    title: "Feedback en opleveringen",
    description: "Versiehistoriek met reacties rechtstreeks op het beeld, in plaats van lange e-mailthreads.",
  },
  {
    icon: FolderTree,
    title: "Bestanden met mappen",
    description: "Geneste mappen en slepen tussen mappen, zo overzichtelijk als je klant gewend is.",
  },
  {
    icon: Sparkles,
    title: "AI-assistent",
    description: "Je klant krijgt meteen antwoord op vragen over de eigen projecten.",
  },
  {
    icon: ShieldCheck,
    title: "Eigen branding, afgeschermd per klant",
    description: "Jouw logo en jouw kleur. Dat elke klant enkel de eigen gegevens ziet, dwingt de database af.",
  },
] as const;

const PLANS = [
  {
    name: "Starter",
    price: "129",
    description: "Voor freelancers en kleine bureaus die starten met een eigen klantenportaal.",
    features: ["Tot 5 klanten", "2 teamleden", "Projecten, aanvragen en bestanden", "Contentplanning"],
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
      "Feedback en opleveringen met versiehistoriek",
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

// Alleen vragen waarvan het antwoord vaststaat in het product zelf.
const FAQ = [
  {
    q: "Hoe lang kan ik gratis uitproberen?",
    a: "14 dagen. Je hebt geen creditcard nodig om te starten.",
  },
  {
    q: "Zijn de prijzen inclusief btw?",
    a: "Nee. Alle prijzen zijn exclusief btw.",
  },
  {
    q: "Kan ik maandelijks opzeggen?",
    a: "Ja. Je zit niet vast aan een langere looptijd.",
  },
  {
    q: "Kan ik het portaal in mijn eigen huisstijl zetten?",
    a: "Ja. Je stelt je eigen logo, naam en accentkleur in. Je klanten zien jouw merk.",
  },
  {
    q: "Zien mijn klanten elkaars gegevens?",
    a: "Nee. Elke klant ziet enkel de eigen projecten, bestanden en berichten. Dat wordt in de database afgedwongen, niet enkel op het scherm.",
  },
  {
    q: "Wat kunnen mijn klanten in hun portaal doen?",
    a: "Projecten volgen, content goedkeuren, feedback geven op opleveringen, bestanden delen en vragen stellen aan de AI-assistent.",
  },
] as const;

export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="overflow-x-hidden bg-canvas text-ink">
      <header className="px-4 sm:px-8">
        <div className="mx-auto flex h-[72px] max-w-page items-center justify-between">
          <Link href="/" className="focus-ring rounded-sm">
            <Wordmark className="w-[120px] text-ink sm:w-[132px]" />
          </Link>
          <nav className="hidden items-center gap-8 text-[15px] text-ink-muted md:flex">
            <a href="#functies" className="transition-colors hover:text-ink">
              Functies
            </a>
            <a href="#prijzen" className="transition-colors hover:text-ink">
              Prijzen
            </a>
            <a href="#vragen" className="transition-colors hover:text-ink">
              Vragen
            </a>
            <Link href="/login" className="transition-colors hover:text-ink">
              Inloggen
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-ink md:hidden">
              Inloggen
            </Link>
            <Link href="/register" className="btn-primary">
              Gratis proberen
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 pb-18 pt-12 sm:px-8 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-page">
          <p className="text-label font-medium uppercase text-ink-muted">Klantenportaal voor agencies</p>
          <h1 className="mt-5 max-w-3xl font-display text-[2.5rem] font-semibold leading-none tracking-[-0.05em] sm:text-display">
            één plek voor je klanten<span className="text-tdv-terra">.</span>
          </h1>
          <p className="mt-6 max-w-prose text-[19px] font-light leading-relaxed text-ink-muted">
            Je klanten volgen hun projecten, content, feedback en bestanden in een omgeving met jouw logo en kleuren.
            Gebouwd voor marketingbureaus, freelancers en agency-startups.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/register" className="btn-primary h-12 px-6">
              Start je gratis proefperiode
            </Link>
            <a href="#functies" className="btn-secondary h-12 px-6">
              Bekijk de functies
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-muted">14 dagen gratis uitproberen, geen creditcard nodig.</p>
          {/* TODO (Thomas): echte screenshot van het portaal hier, in een kader
              met rounded-2xl en shadow-lg (richtlijnen sectie 4.2). Geen
              stockbeeld als vervanger. */}
        </div>
      </section>

      <section id="functies" className="scroll-mt-8 bg-surface-sunken px-4 py-18 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-page">
          <p className="text-label font-medium uppercase text-ink-muted">Functies</p>
          <h2 className="mt-3 max-w-xl font-display text-h2 font-semibold sm:text-h1">
            wat je klanten in hun portaal vinden.
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card p-6">
                <Icon size={22} strokeWidth={1.75} className="text-ink" aria-hidden="true" />
                <h3 className="mt-4 font-display text-h3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="prijzen" className="scroll-mt-8 px-4 py-18 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-page">
          <p className="text-label font-medium uppercase text-ink-muted">Prijzen</p>
          <h2 className="mt-3 font-display text-h2 font-semibold sm:text-h1">eenvoudige, eerlijke prijzen.</h2>
          <p className="mt-3 max-w-prose text-ink-muted">Je begint met 14 dagen gratis.</p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.featured
                    ? "relative flex flex-col rounded-2xl border-2 border-accent bg-surface p-8"
                    : "relative flex flex-col rounded-2xl border border-border bg-surface p-8"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-label font-medium uppercase text-ink-muted">{plan.name}</p>
                  {plan.featured && (
                    <span className="rounded-pill bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-fg">
                      Aanbevolen
                    </span>
                  )}
                </div>
                <p className="mt-5 font-display text-[2.5rem] font-semibold leading-none tabular-nums tracking-[-0.04em]">
                  € {plan.price}
                  <span className="ml-1 font-sans text-[15px] font-normal tracking-normal text-ink-muted">/maand excl. btw</span>
                </p>
                <p className="mt-4 text-sm text-ink-muted">{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-done" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-8 w-full ${plan.featured ? "btn-primary" : "btn-secondary"}`}>
                  Start je proefperiode
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-muted">Alle prijzen excl. btw. Maandelijks opzegbaar.</p>
        </div>
      </section>

      <section id="vragen" className="scroll-mt-8 bg-surface-sunken px-4 py-18 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-label font-medium uppercase text-ink-muted">Vragen</p>
          <h2 className="mt-3 font-display text-h2 font-semibold sm:text-h1">vaak gesteld.</h2>
          <div className="mt-10 divide-y divide-border-strong border-y border-border-strong">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown
                    size={18}
                    strokeWidth={1.75}
                    className="shrink-0 text-ink-muted transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="max-w-prose pb-5 text-ink-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-tdv-dark px-4 py-18 text-center sm:px-8 sm:py-24">
        <h2 className="font-display text-h2 font-semibold text-tdv-beige sm:text-h1">klaar om te starten?</h2>
        <p className="mx-auto mt-4 max-w-prose text-tdv-beige/80">
          Start je gratis proefperiode van 14 dagen. Je hebt geen creditcard nodig.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/register" className="btn-primary h-12 px-6 focus-visible:ring-offset-tdv-dark">
            Start je gratis proefperiode
          </Link>
        </div>
      </section>

      <footer className="border-t border-tdv-beige/10 bg-tdv-dark px-4 py-10 text-sm text-tdv-beige/70 sm:px-8">
        <div className="mx-auto flex max-w-page flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="focus-ring w-fit rounded-sm">
            <Wordmark className="w-[132px] text-tdv-beige" />
          </Link>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/login" className="transition-colors hover:text-tdv-beige">
              Inloggen
            </Link>
            {/* Tijdelijk de algemene teksten van tdv. marketing; eigen
                portaalteksten (SaaS/verwerkersovereenkomst) staan op de
                README-backlog als begeleid punt. */}
            <a href="https://tdvmarketing.be/privacybeleid/" className="transition-colors hover:text-tdv-beige">
              Privacybeleid
            </a>
            <a href="https://tdvmarketing.be/algemene-voorwaarden/" className="transition-colors hover:text-tdv-beige">
              Algemene voorwaarden
            </a>
            <a href="https://tdvmarketing.be" className="transition-colors hover:text-tdv-beige">
              Een product van tdv. marketing
            </a>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-page text-xs text-tdv-beige/50">
          © {new Date().getFullYear()} TDV Marketing Solutions · BE0745.686.114 · Halfuurdreef 89, 8210 Zedelgem
        </p>
      </footer>
    </main>
  );
}
