# TDV Client Portal — technische architectuur

Dit is een werkende **scaffold**, geen kant-en-klare app: de fundamenten (auth,
tenancy, database schema, RLS, routing, één volledige module end-to-end) staan
er echt en draaien, de overige modules uit de brief zijn als lege routes met
een consistent patroon aangelegd zodat ze snel bij te bouwen zijn.

## Stack

| Laag | Keuze | Waarom |
|---|---|---|
| Framework | Next.js 14, App Router | Server Components → data blijft server-side, geen aparte API-laag nodig voor reads |
| Taal | TypeScript, strict mode | Fouten in tenancy-logica (welk bedrijf mag wat zien) horen compile-time gevangen te worden waar mogelijk |
| Styling | Tailwind CSS | Snel, en design tokens (kleur/typografie) zitten centraal in `tailwind.config.ts` |
| Database + Auth | Supabase (Postgres + Auth + Storage) | Eén platform voor DB, login, files; Row Level Security doet het zware werk voor multi-tenancy |
| AI / RAG | Postgres `pgvector` + Anthropic Messages API | Geen aparte vector-DB nodig; retrieval en generatie blijven in dezelfde infrastructuur |
| Hosting | Vercel | Native Next.js support, preview deployments per PR |

## Waarom dit datamodel

**Eén regel, geen twee.** In plaats van elke module (projecten, aanvragen,
content, bestanden) los te beveiligen, hangt letterlijk elke tabel met
klantgegevens aan `companies.id`, en één stel RLS-policies (`is_tdv_staff()` /
`current_company_id()`) bepaalt overal wie wat mag zien. Dat betekent: een bug
in een React-component kan nooit klantdata van bedrijf A tonen aan bedrijf B —
de database weigert de query, niet de UI.

**RLS in de database, niet "if" in de React-code.** Je zal in `lib/data/*.ts`
geen `.eq('company_id', ...)` filters vinden op basis van iets dat de client
meestuurt. De sessie van de ingelogde gebruiker draagt zijn/haar identiteit;
Postgres bepaalt de rest. Dat is de belangrijkste architecturale beslissing in
dit project en zou dat ook moeten blijven bij uitbreiding.

**AI-assistent leest nooit rechtstreeks.** `ai_documents` (de RAG-kennisbank)
heeft bewust géén client-facing SELECT-policy. De enige toegang loopt via de
API-route `app/api/ai/chat/route.ts`, die zelf eerst `company_id` opzoekt via
de ingelogde sessie en dat als verplichte parameter doorgeeft aan de
`match_ai_documents` functie. Dubbele afscherming voor het gevoeligste stuk
van het systeem.

## Wat er echt werkt (volg dit patroon voor de rest)

- **Auth**: login, wachtwoord vergeten/resetten, sessiebeheer via cookies,
  middleware die elke request ververst en niet-ingelogde gebruikers naar
  `/login` stuurt.
- **Projecten**: lijst + detail + opmerkingen, volledig via Server Components
  + RLS — `lib/data/projects.ts` → `app/(portal)/projects/*`.
- **Aanvragen** (route `/aanvragen`, ex-"tickets" — enkel de UI/routes zijn
  hernoemd, de tabel heet in de database nog steeds `tickets` en
  `lib/data/tickets.ts` ook): lijst, nieuw, detail + reageren.
- **Projectaanvragen**: lichte statustracker naast de gewone aanvragen — een
  klant vraagt een nieuw project aan (`/projects` → "Project aanvragen").
  Meteen daarna genereert de AI-assistent een richtprijs (`lib/ai/indicative-price.ts`,
  Anthropic Messages API, best-effort — geen richtprijs = gewoon geen prompt),
  die de klant expliciet moet accepteren of weigeren; accepteren zet de
  aanvraag automatisch op "wacht op offerte" (staff bereidt de échte offerte
  per e-mail voor), weigeren op "geweigerd". Staff kan de status ook altijd
  handmatig doorzetten. Geen bedragen, items of PDF's in de app: dit is en
  blijft een indicatie, geen offerte — `lib/data/project-requests.ts` +
  `lib/data/admin/project-requests.ts`. De accepteer/weiger-write loopt via
  de `respond_to_project_request_price` Postgres-functie (migratie 0016) in
  plaats van een client-UPDATE-policy, zodat een klant nooit iets anders dan
  die ene beslissing kan wijzigen.
- **Feedback & goedkeuring**: lijst, detail met versiehistoriek, preview en
  status-acties (goedkeuren/revisie vragen) — `lib/data/deliverables.ts`.
- **Contentplanning**: maandkalender + lijst, detail met visual
  (afbeelding/video), opmerkingen en de volledige statuslevenscyclus
  (concept → wacht op goedkeuring → goedgekeurd/revisie → ingepland →
  gepubliceerd) — klant keurt goed/vraagt revisie, staff beheert de rest
  (aanmaken, bewerken, visual uploaden, status verzetten) vanaf
  `/admin/content` — `lib/data/content.ts` + `lib/data/admin/content.ts`.
- **Bestanden**: overzicht + upload naar de `client-files` Storage-bucket —
  `lib/data/files.ts`.
- **Meldingen**: lijst, ongelezen-badge in de sidebar, alles-gelezen-actie,
  live updates via `supabase.channel(...)` (migratie 0013 zet `notifications`
  in de `supabase_realtime`-publicatie) + e-mail via Resend
  (`lib/email/send.ts`), met een opt-out per gebruiker in Instellingen
  (`profiles.email_notifications`, migratie 0014). Triggers zitten in
  `createTicket`/`addTicketMessage` (nieuw ticket / nieuw bericht) en
  `updateContentItemAdmin` (content naar "wacht op goedkeuring") —
  `lib/data/notifications.ts`.
- **Dashboard**: "vraagt je aandacht" (openstaande goedkeuringen, aanvragen
  die op je wachten) + recente activiteit, rolgebonden (klant vs. staff) —
  `lib/data/dashboard.ts`.
- **Instellingen**: naam en wachtwoord aanpasbaar, meldingsvoorkeur — niet
  langer alleen-lezen.
- **AI-assistent**: chat-UI + RAG API-route + pgvector search RPC +
  gespreksgeschiedenis, plus een kennisbank-ingestpipeline
  (`lib/data/admin/ai-ingest.ts`, te starten vanaf `/admin/ai`) die
  projecten, aanvragen, feedback en contentplanning omzet naar doorzoekbare
  chunks in `ai_documents`.
- **Admin**: layout met dubbele rolcheck (middleware + layout zelf), en CRUD
  voor klanten, projecten, aanvragen, content en gebruikers, plus
  AI-activiteit en instellingen.

## Wat nog moet worden bijgebouwd

- [ ] Kennisbank-ingest is nu een synchrone admin-actie die alles herembedt;
      bij meer data wordt dat een achtergrondtaak met incrementele sync
      (bv. op basis van `updated_at`) in plaats van volledige resync.
- [ ] Notificatietriggers dekken nu aanvragen en content-goedkeuring. Feedback
      (deliverables) en contentopmerkingen hebben nog geen trigger — die
      module heeft ook nog geen "nieuwe versie uploaden"-flow in de app zelf
      (deliverables/versions bestaan enkel als ze rechtstreeks in de
      database aangemaakt worden).

## Setup

```bash
npm install
cp .env.example .env.local   # vul Supabase- en Anthropic-sleutels in

npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push          # past supabase/migrations/*.sql toe

npm run db:types              # genereert types/database.types.ts uit het echte schema
npm run dev
```

## Mappenstructuur

```
app/
  (auth)/login/            → publieke auth-routes
  (portal)/                → alles achter login, gedeelde sidebar-layout
    dashboard/ projects/ aanvragen/ content-planning/
    files/ ai-assistant/ notifications/ settings/
  (admin)/admin/           → TDV-staff-only, eigen layout + rolcheck
  api/ai/chat/             → RAG endpoint
  api/webhooks/supabase/   → plek voor bv. Storage/Auth webhooks
lib/
  supabase/                → client/server/middleware helpers (RLS-bewust)
  data/                    → server-only data access per module
components/
  layout/                  → Sidebar, (nog toe te voegen: Topbar)
  ui/ dashboard/ projects/ aanvragen/ → per-module presentatie­componenten
supabase/
  migrations/0001_init.sql     → volledig schema + RLS voor elke module
  migrations/0002_ai_search.sql → pgvector RPC voor de AI-assistent
types/
  database.types.ts   → placeholder, vervang via `npm run db:types`
  domain.ts           → handgeschreven types die de UI gebruikt
```

## Design tokens

`tailwind.config.ts` bevat een **placeholder** premium/minimalistisch
kleurenpalet (donker bosgroen accent, veel witruimte) dat de sfeer van
Notion/Linear/Stripe volgt zoals de brief vraagt. Vervang de hex-waarden door
TDV's echte huisstijlkleuren zodra beschikbaar — elke component leest kleur
via deze tokens, dus dat is een aanpassing in één bestand.
