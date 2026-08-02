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

**Eén regel, geen twee.** In plaats van elke module (projecten, tickets,
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

- **Auth**: login, sessiebeheer via cookies, middleware die elke request
  ververst en niet-ingelogde gebruikers naar `/login` stuurt.
- **Projecten**: lijst + detail, volledig via Server Components + RLS —
  `lib/data/projects.ts` → `app/(portal)/projects/*`.
- **Tickets**: lijst + `createTicket()` server-actie-achtige helper.
- **AI-assistent**: chat-UI + RAG API-route + pgvector search RPC.
- **Admin**: layout met dubbele rolcheck (middleware + layout zelf), en één
  voorbeeldpagina (`/admin/clients`).

## Wat nog moet worden bijgebouwd

Elke onderstaande module volgt exact hetzelfde patroon als **projecten**
hierboven: een `lib/data/<module>.ts` bestand met RLS-vertrouwende queries,
plus een route onder `app/(portal)/<module>/`.

- [ ] Feedback & goedkeuring — schema (`deliverables`, `deliverable_versions`,
      `deliverable_comments`) staat al in de migratie; UI met preview + pin-
      comments + versiehistoriek ontbreekt nog.
- [ ] Contentplanning — schema (`content_items`) staat er; kalenderweergave
      (bv. met een lichte wrapper rond `date-fns`) moet nog gebouwd worden.
- [ ] Bestanden — Storage-bucket + RLS-policies staan in de migratie; UI voor
      upload (drag-and-drop) en zoekfunctie ontbreekt.
- [ ] Meldingen — tabel + RLS staan klaar; realtime updates via
      `supabase.channel(...)` (Postgres changes) + e-mailnotificaties (kies
      een provider, zie `.env.example`) moeten nog aangesloten worden.
- [ ] Wachtwoord vergeten / registratieflow voor nieuwe klantgebruikers.
- [ ] Admin: projecten/tickets/content/gebruikers-beheer (alleen `/clients`
      staat als voorbeeld).
- [ ] Ingest-pipeline die projecten/tickets/facturen omzet naar chunks +
      embeddings in `ai_documents` (nu staat alleen de retrieval-kant klaar).

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
    dashboard/ projects/ tickets/ content-planning/
    files/ ai-assistant/ notifications/ settings/
  (admin)/admin/           → TDV-staff-only, eigen layout + rolcheck
  api/ai/chat/             → RAG endpoint
  api/webhooks/supabase/   → plek voor bv. Storage/Auth webhooks
lib/
  supabase/                → client/server/middleware helpers (RLS-bewust)
  data/                    → server-only data access per module
components/
  layout/                  → Sidebar, (nog toe te voegen: Topbar)
  ui/ dashboard/ projects/ tickets/ → per-module presentatie­componenten
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
