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
  klant vraagt een nieuw project aan (`/projects` → "Project aanvragen") via
  een korte intake: titel, type project en budget-indicatie (selects, geen
  vrije tekst — migratie 0020), optioneel een omschrijving en gewenste
  deadline. Meteen daarna bepaalt de AI-assistent een prijsvoorstel
  (`lib/ai/indicative-price.ts`, Anthropic Messages API, best-effort — geen
  API-key of mislukte call = gewoon geen prijsvoorstel) op basis van al die
  intake-velden, dat effectief als prijs aan de klant getoond wordt, niet
  enkel als vrijblijvende schatting. De klant moet dat expliciet aanvaarden
  of weigeren; aanvaarden zet de aanvraag automatisch op "wordt opgestart"
  (staff bereidt het project voor), weigeren op "geweigerd". Staff kan de
  status ook altijd handmatig doorzetten, en ziet type/budget/deadline in de
  aanvragentabel op `/admin/projects`. Nog geen line-items of PDF's in de
  app — `lib/data/project-requests.ts` + `lib/data/admin/project-requests.ts`.
  De aanvaard/weiger-write loopt via de `respond_to_project_request_price`
  Postgres-functie (migratie 0016) in plaats van een client-UPDATE-policy,
  zodat een klant nooit iets anders dan die ene beslissing kan wijzigen.
- **Feedback & goedkeuring**: lijst, detail met versiehistoriek, preview en
  status-acties (goedkeuren/revisie vragen) — `lib/data/deliverables.ts`.
- **Contentplanning**: maandkalender (drag-and-drop herplannen, sleep vanuit
  "Nog niet ingepland") + lijst, detail met visual (afbeelding/video),
  opmerkingen en de volledige statuslevenscyclus (concept → wacht op
  goedkeuring → goedgekeurd/revisie → ingepland → gepubliceerd) — klant
  keurt goed/vraagt revisie, staff beheert de rest (aanmaken, dupliceren,
  verwijderen, bewerken, visual uploaden, status verzetten) vanaf
  `/admin/content` of rechtstreeks vanuit de kalender. Elk item ondersteunt
  meerdere social-mediakanalen tegelijk (`channels`-array); de kalender kan
  filteren op zowel status als kanaal, en heeft per dag een snel-toevoegen-
  knop die de datum al invult. Dupliceren zet een kopie in "Nog niet
  ingepland" (status concept), zodat een reeks vergelijkbare posts snel
  aangemaakt en dan één voor één naar hun dag gesleept kan worden —
  `lib/data/content.ts` + `lib/data/admin/content.ts`. Het "gepland
  voor"-veld voor staff is nu datum + tijd (i.p.v. enkel datum), zodat het
  exacte postmoment vastligt zodra er automatisch gepubliceerd kan worden.
- **Social kanalen** (scaffold, nog niet functioneel): `social_accounts`
  (migratie 0019) + `/admin/clients/[id]` toont per klant of Instagram/
  Facebook/LinkedIn verbonden zijn. Nog geen OAuth-koppelflow of echte
  publicatie — dat vereist eerst Meta App Review
  (`instagram_content_publish`/`pages_manage_posts`) en toegang tot het
  LinkedIn Marketing Developer Platform, externe goedkeuringen die TDV zelf
  moet aanvragen. De "Verbinden"-knop staat er al, maar is bewust
  uitgeschakeld tot die koppeling bestaat — `lib/data/admin/social-accounts.ts`.
- **Bestanden**: overzicht + upload naar de `client-files` Storage-bucket —
  `lib/data/files.ts`.
- **Klantlogo**: staff kan per klant een logo uploaden op `/admin/clients/[id]`
  (`companies.logo_url`, al aanwezig sinds migratie 0001, nu voor het eerst
  gebruikt). Opslag in de publieke `company-logos`-bucket (migratie 0021) —
  `logo_url` is dus meteen een stabiele, publieke URL, geen signed URL die
  telkens opnieuw gegenereerd moet worden. Zichtbaar in de klantenlijst, het
  klantdetail, en — als de ingelogde gebruiker een klant is, niet staff — in
  de sidebar naast "TDV Portaal" — `lib/data/admin/companies.ts`.
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
- **"Bekijk als klant"**: staff heeft geen eigen `company_id`, dus klant-only
  acties (project aanvragen, aanvraag/content aanmaken, bestand uploaden)
  kunnen normaal niet vanaf een staff-account. Via de sidebar kiest staff
  een klant en de portal-pagina's tonen en gedragen zich dan als die klant —
  zonder uit- en opnieuw inloggen. Puur een UI-cookie (`lib/staff-view.ts`);
  RLS geeft staff sowieso al volledige toegang tot elke klant, dus dit
  vergroot niets, het schakelt enkel een bestaand write-pad in de UI in.

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
