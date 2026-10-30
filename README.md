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

**Rechten en tenant wijzig je niet vanuit de app.** RLS bepaalt welke rijen
iemand mag wijzigen, niet welke kolommen. Twee `BEFORE UPDATE`-triggers
(migratie `0034_guard_privileged_columns.sql`) sluiten dat gat:
- **profiles:**
  - `agency_id` en `is_platform_admin` veranderen alleen server-side (service
    role of rechtstreeks in de database);
  - `role` en `company_id` mag enkel staff van dezelfde agency wijzigen (het
    `/admin/users`-scherm).
- **agencies:** van buitenaf zijn alleen de brandingkolommen te wijzigen.
  Status, plan, trial en facturatie lopen enkel server-side. Dat is een
  allow-list: een nieuwe kolom is standaard afgesloten.

Registratie en uitnodigingen gebruiken de service role en blijven dus werken.

## Wat er echt werkt (volg dit patroon voor de rest)

- **Auth**: login, registratie, wachtwoord vergeten/resetten, sessiebeheer
  via cookies, middleware die elke request ververst en niet-ingelogde
  gebruikers naar `/login` stuurt — behalve op `/` zelf, zie hieronder.
- **Landingpage** (`/`, `app/page.tsx`): publieke marketing-/pricingpagina
  in TDV-branding, de eerste stap richting een zelfbedienbaar SaaS-product
  voor marketingbureaus, freelancers en agency-startups. Ingelogde
  bezoekers worden meteen doorgestuurd naar `/dashboard` (zelfde route,
  gewoon een `redirect()` in de page in plaats van middleware — middleware
  laat `/` nu als enige uitzondering door zonder sessie). Drie
  prijstiers (Essentieel €129, Professioneel €349, Agency €899 per maand excl.
  btw; interne codes starter/growth/agency), door de klant
  bevestigd. "Start gratis proefperiode" linkt naar het bestaande
  `/register` (14 dagen),
  "Inloggen" naar `/login`. Bewust puur presentationeel: geen Stripe, geen
  nieuwe tabellen, geen wijziging aan het company/tenancy-model — zie de
  uitleg verderop in dit bestand over waarom de echte SaaS-architectuur
  apart, begeleid werk blijft.
- **Registratie**: `/register` laat een nieuwe klant zelf een account +
  bedrijf aanmaken (naam, bedrijfsnaam, e-mail, wachtwoord) —
  `app/(auth)/register/actions.ts`. Alles (auth user, `companies`-rij,
  `profiles`-rij) wordt in één server action met de admin-client aangemaakt,
  niet via een client-side `signUp()` gevolgd door een losse server action —
  dat laatste zou een client-aangeleverde user-id vertrouwen bij het
  schrijven van de profielrij. Het nieuwe bedrijf start op
  `onboarding_status = 'pending_review'` (migratie 0022, standaard `'active'`
  voor door staff aangemaakte klanten) en de klant ziet op `/dashboard` een
  "wachten op TDV"-scherm tot een staff-lid het activeert vanaf
  `/admin/clients/[id]` ("Activeren"-knop, ook zichtbaar als badge in de
  klantenlijst).
- **Projecten**: lijst + detail + opmerkingen, volledig via Server Components
  + RLS — `lib/data/projects.ts` → `app/(portal)/projects/*`.
- **Aanvragen** (route `/aanvragen`, ex-"tickets" — enkel de UI/routes zijn
  hernoemd, de tabel heet in de database nog steeds `tickets` en
  `lib/data/tickets.ts` ook): lijst, nieuw, detail + reageren. Geen eigen
  item meer in de klant-navigatie — een aanvraag hoort bij een project, dus
  die maak/bekijk je vanaf de projectdetailpagina ("Gekoppelde aanvragen" +
  het "+"-knopje, dat naar `/aanvragen/new?project=<id>` linkt en het
  project vooraf invult). `/aanvragen/new` en `/aanvragen/[id]` blijven
  gewoon bestaan als routes, ook zonder projectcontext.
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
  Ook geen eigen item meer in de klant-navigatie: een deliverable hoort bij
  een project (`deliverables.project_id`), dus de "Feedback & opleveringen"-
  sectie op de projectdetailpagina lijst ze per project op (titel + status
  van de laatste versie) en linkt door naar de bestaande `/feedback/[id]`.
  Staff kan nu ook vanuit de app zelf een nieuwe deliverable aanmaken (titel
  + eerste versie, vanaf de projectdetailpagina) en een nieuwe versie
  uploaden op een bestaande deliverable (vanaf `/feedback/[id]`) —
  `lib/data/admin/deliverables.ts`. Voorheen bestonden deliverables/
  deliverable_versions enkel als ze rechtstreeks in de database werden
  aangemaakt; de RLS-insertpolicies daarvoor stonden er wel al sinds
  migratie 0007, alleen de app-laag ontbrak nog. Een nieuwe versie
  notifieert de klant, zelfde patroon als contentgoedkeuring.
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
- **Bestanden**: echte, zelf aan te maken geneste mappen (OneDrive-stijl) +
  upload naar de `client-files` Storage-bucket — `lib/data/folders.ts` +
  `lib/data/files.ts`. Een nieuwe `folders`-tabel (migratie 0023,
  `parent_id` voor nesting, RLS zoals `files`: iedereen van het bedrijf mag
  aanmaken, staff of de aanmaker mag verwijderen) + `files.folder_id`.
  `/files` is de root, `/files/[folderId]` een specifieke map; bovenaan
  staat altijd een klikbaar broodkruimelpad (`FolderBrowser.tsx`) zodat
  nooit onduidelijk is waar je je bevindt. Een map verwijderen verwijdert
  ook de submappen erin (cascade), maar bestanden overleven altijd — ze
  vallen terug naar de dichtstbijzijnde map die blijft bestaan
  (`folder_id` → `on delete set null`), nooit stilletjes weg. De oude
  vaste categorieën (Logo, Huisstijl, Foto, …) blijven bestaan als tag per
  bestand (`files.category`, zichtbaar als badge in `FileList`), maar
  sturen de navigatie niet meer aan — mappen doen dat nu.
  "Nieuwe map"/"Bestand uploaden" zijn verborgen voor staff zolang er geen
  klant gekozen is via "Bekijk als klant" (zelfde patroon als `/projects`)
  — zonder klant is er geen `company_id` om de map/het bestand aan te
  hangen. Bestanden zijn sleepbaar (native HTML5 drag-and-drop, geen
  library) naar een submap-tegel of naar om het even welke stap in het
  broodkruimelpad, om ze tussen mappen te verplaatsen — `moveFile`
  (`lib/data/files.ts`), met een `files`-updatebeleid (migratie 0024:
  staff of de eigen uploader, zelfde beperking als het bestaande
  verwijderbeleid) dat er voordien niet was.
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
  `createTicket`/`addTicketMessage` (nieuw ticket / nieuw bericht),
  `updateContentItemAdmin` (content naar "wacht op goedkeuring"), en
  `addContentItemComment`/`addDeliverableComment` (nieuwe opmerking bij
  content resp. feedback/deliverables) — `lib/data/notifications.ts`. Elke
  opmerking-trigger notifieert "de andere kant": schrijft een klant, dan
  heel TDV (geen vaste toewijzing per content-item/deliverable, dus net als
  bij een nieuw ticket); schrijft staff, dan alle klantprofielen van dat
  bedrijf. Geen eigen item meer in de klant-navigatie — het belletje
  bovenaan de sidebar linkt al naar `/notifications`, dus een tweede
  menu-item naar diezelfde pagina was overbodig.
- **Dashboard**: "vraagt je aandacht" (openstaande goedkeuringen, aanvragen
  die op je wachten) + recente activiteit, rolgebonden (klant vs. staff) —
  `lib/data/dashboard.ts`.
- **Instellingen**: naam en wachtwoord aanpasbaar, meldingsvoorkeur — niet
  langer alleen-lezen.
- **AI-assistent**: chat-UI + RAG API-route + pgvector search RPC +
  gespreksgeschiedenis (mislukt een antwoord, dan geeft de route een 502
  en bewaart ze niets; de vraag blijft staan met "Opnieuw proberen" in
  hetzelfde gesprek, en een mislukte vraag gaat nooit mee als
  geschiedenis), plus een kennisbank-ingestpipeline
  (`lib/data/admin/ai-ingest.ts`, te starten vanaf `/admin/ai`) die
  projecten, aanvragen, feedback en contentplanning omzet naar doorzoekbare
  chunks in `ai_documents`. Incrementeel by default: de watermark is
  gewoon de nieuwste `ai_documents.created_at` van de vorige run (geen
  aparte statustabel nodig), en elke bron die sinds dan veranderd is —
  via zijn eigen `updated_at` + zijn commentaar-/versietabellen'
  `created_at`, want een nieuwe opmerking stuwt de `updated_at` van de
  ouder niet op — krijgt al zijn chunks herbouwd. Bekende beperking:
  een statuswijziging op een `deliverable_versions`-rij (goedkeuren/
  revisie) zonder nieuwe rij wordt niet incrementeel opgepikt (die tabel
  heeft geen `updated_at`), en incrementeel ruimt nooit chunks op voor
  een bron die volledig verwijderd is — daarvoor is de "Volledig
  herbouwen"-link op `/admin/ai` bedoeld (`ingestKnowledgeBase({
  fullResync: true })`). Draait ook automatisch: `/api/cron/ai-ingest`
  (Vercel Cron, `vercel.json`, dagelijks 03:00 UTC) roept
  `ingestKnowledgeBaseAsCronJob()` aan — een aparte entry point die via
  de admin-client leest i.p.v. de RLS-bound sessie-client, want een
  cron-aanroep heeft geen staff-sessie om `is_tdv_staff()` tegen te
  laten gelden. Geauthenticeerd via een `CRON_SECRET`-omgevingsvariabele
  die Vercel zelf als bearer-header meestuurt bij geplande aanroepen —
  door Thomas toegevoegd in Vercel → Settings → Environment Variables,
  dus de job draait nu daadwerkelijk i.p.v. veilig te falen (401).
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
- **Toegankelijkheid**: `.btn-secondary`/`Button`'s `ghost`-variant kregen
  een `focus-visible`-ring (ontbrak voorheen — "Annuleren" in elke dialog
  was onzichtbaar gefocust); het wachtwoord-toon/verberg-veld had
  `tabIndex={-1}` en was daardoor via het toetsenbord onbereikbaar; de
  pin-plaatsing op een feedback-afbeelding (`VersionPreview.tsx`) was een
  plain `<div onClick>` zonder toetsenbordequivalent, nu met
  `role="button"` + Enter/spatie (plaatst de pin in het midden — exact
  op een pixel mikken heeft geen zinvol toetsenbordequivalent). Bestanden
  verplaatsen tussen mappen kon enkel via slepen (geen
  toetsenbord-/schermlezertoegankelijk alternatief) — `FileList.tsx`
  heeft er nu een `<select>` "Verplaatsen naar…" per bestand bij, met
  dezelfde bestemmingen als het slepen toelaat. Kleurcontrast is
  systematisch gecheckt: een berekende WCAG AA-audit (relatieve
  luminantie + contrastratio, niet op het oog) vond en verhelpte
  `ink-muted` (4.29:1 op canvas, nu 5.16:1) en alle vijf statuskleuren
  (die nooit een apart dark-mode-tintje hadden en in licht én donker
  onder 4.5:1 zaten) plus de "vandaag"-badge in de
  contentplanningskalender (2.81:1 in dark mode).
- **Foutafhandeling**: geen enkele route had een `error.tsx` of
  `not-found.tsx` — een onverwachte fout (bv. een trage/haperende
  Supabase-call) of een ongeldige/verwijderde `[id]` (zes plekken roepen
  `notFound()` aan) viel terug op Next.js' eigen kale, onopgemaakte
  scherm. Toegevoegd: `(portal)/error.tsx` + `not-found.tsx`,
  `(admin)/admin/error.tsx` + `not-found.tsx` (zelfde `EmptyState`-look,
  met een "Probeer opnieuw"-knop op de foutpagina's), en een root-niveau
  `app/error.tsx` + `app/not-found.tsx` als laatste vangnet voor fouten
  die van buiten de portal/admin-boom komen (bv. de root layout zelf).
- **Performance**: de vier status-dropdowns (`ProjectStatusSelect`,
  `ProjectRequestStatusSelect`, `ContentStatusSelect`, `TicketStatusSelect`
  — alle vier staff z'n meest gebruikte, meest frequente actie) toonden de
  nieuwe status pas na een volledige `router.refresh()`-rondtrip; nu
  optimistic (de dropdown toont de keuze onmiddellijk, met een stille
  terugrol + foutmelding als de server-call alsnog faalt). Andere
  `router.refresh()`-plekken in de app zijn dialogs/formulieren met hun
  eigen knop-laadstatus — daar is wachtfeedback al verwacht gedrag, geen
  vergelijkbaar gat.
- **Performance, ontbrekende indexen**: Postgres indexeert foreign keys niet
  automatisch, en op de pgvector-index na (0001) had het hele schema er
  nul. Elke RLS-policy sinds 0001 draait op `company_id = current_company_id()`
  of een EXISTS-join via `companies.agency_id` — dat liep op elke select
  tegen projecten, tickets, content, bestanden, mappen, aanvragen en
  meldingen (dus elke dashboard-/project-/ticket-/content-planning-/
  bestanden-/meldingen-paginalaad) via een sequential scan om tenantisolatie
  af te dwingen. Migratie `0033_fk_indexes.sql` voegt een index toe op elke
  foreign key die daadwerkelijk gefilterd/gejoind wordt (geverifieerd via
  de live schema-introspectie, niet gegokt) — puur additief, geen
  gedragswijziging. Toegepast op de live database.
- **Performance, N+1-thumbnails**: de contentplanningskalender haalde een
  signed thumbnail-URL op per item met een afbeelding — één aparte
  Storage-call per item, dus een maand met 20 geplande posts deed 20
  losse round trips naast de lijstquery zelf. `getFileDownloadUrls()`
  (nieuw, `lib/data/files.ts`) batcht dat via Supabase Storage's
  `createSignedUrls` (meervoud) in één call; `withVisualThumbnails` en
  `withVisualThumbnailsAdmin` gebruiken 'm nu allebei.
- **Laadstatussen**: de hele `/admin`-sectie (8 routes: aanvragen, AI,
  klanten, klantdetail, content, projecten, instellingen, gebruikers) had
  géén `loading.tsx` — een paginawissel toonde tot de data binnen was
  gewoon niets, in plaats van de skeleton-laadstaat die de rest van het
  portaal al had. Plus `dashboard` (meerdere parallelle queries, vaak de
  eerste pagina na inloggen) en `files/[folderId]` (had 'm wel op
  `/files` maar niet op een submap). Allemaal met dezelfde
  `Skeleton`-aanpak als de bestaande routes. Nadien ook `rapportage`
  (maandcijfers uit meerdere tabellen), `ai-assistant` (gesprekkenlijst),
  `settings` en `aanvragen/new` (projectlijst voor de keuzelijst): elke
  portaalroute die data ophaalt heeft nu een laadstaat, met de echte
  paginatitel er al in zodat er niets verspringt.

## Wat nog moet worden bijgebouwd

Backlog voor de doorlopende 5-uurlijkse routine (zie onder) — één
afgebakende PR per punt, in deze volgorde:

- [ ] **Performance-audit, vervolg**: optimistic UI voor de status-dropdowns,
      de ontbrekende indexen en de N+1-thumbnails zijn gedaan (zie "Wat er
      echt werkt" hierboven) — vervolg op de regio-fix (zie "Performance"
      hieronder) zodra er een nieuwe trage plek gevonden wordt.

### Testaccounts

Aangemaakt met akkoord van Thomas (28/10), om op te ruimen zodra ze niet meer
nodig zijn. Wachtwoorden staan nergens in de repo of in berichten.

- **Test – Claude** — `tdvmarketingsolutions+claude-test@gmail.com`, rol
  `client_member`, in het fictieve bedrijf **Demo – Atelier Noord (fictief)**
  (slug `demo-atelier-noord`) onder de TDV-agency. Bevat fictieve demo-inhoud
  (3 projecten, 4 content-items, 1 aanvraag) voor screenshots; de hero op de
  landingspagina (`public/brand/portaal-demo-projecten.png`) komt hiervan.
  Opruimen: het bedrijf met die slug en zijn rijen, en de auth-gebruiker.

### Begeleide punten (niet voor de routine, met Thomas uitwerken)

- [ ] **Eigen privacybeleid en voorwaarden voor het portaal**
      (SaaS/verwerkersovereenkomst). Tot dan linkt de footer van de
      landingspagina naar de algemene teksten op tdvmarketing.be.

## Multi-tenant white-label architectuur (actief traject, niet voor de onbemande routine)

De landingspagina belooft een white-label SaaS (andere agency's/freelancers
krijgen een eigen afgeschermde, zelf-gebrande omgeving, met een abonnement
erbovenop) maar `/register` leverde dat tot nu toe niet — het maakte gewoon
een nieuwe klant aan onder TDV's eigen, enige tenant. Dit wordt stap voor
stap rechtgezet via 6 losse, elk apart geverifieerde PR's (plan:
`/root/.claude/plans/whimsical-sauteeing-crayon.md` in de sessie die dit
traject startte) — raakt "de belangrijkste invariant" hierboven beschreven,
dus **expliciet niet voor de onbemande routine**, elke stap begeleid:

1. [x] `agencies`-tabel + backfill van bestaande data naar TDV als Agency #1
       (migratie `0025`) — schema-only, geen gedragsverandering.
2. [x] Rolnaam-hernoeming `tdv_admin`/`tdv_staff` → `agency_admin`/`agency_staff`
       (migratie `0026` + ~15 bestanden, in dezelfde release).
3. [x] Agency-bewuste RLS-herschrijving (migratie `0027`/`0028`) — `is_tdv_staff()`
       vervangen door `is_agency_staff()` + `current_agency_id()` in alle
       policies, inclusief twee bestaande losstaande gaten
       (`profiles_select_staff_public`, `social_accounts` hadden al géén
       enkele scoping).
4. [x] Agency-zelfregistratie (`/register` maakt een `agencies`-rij, directe
       trial, geen betaalstap) + vijf onveilige "notificeer alle staff"-queries
       scopen op agency.
5. [x] Per-agency branding: logo, weergavenaam en accentkleur zijn DB-gedreven
       (`agencies.logo_url`/`brand_name`/`accent_color`, migratie `0032`),
       instelbaar via `/admin/settings` → Branding. Sidebar/MobileNav/admin-
       layout tonen het agency-logo i.p.v. het hardcoded TDV-logo;
       `--color-accent` (CSS custom property, `lib/color.ts`) overschrijft
       Tailwind's `accent`-token runtime, met TDV's terracotta als fallback.
       Vervolg: achter de login zijn `<title>`, favicon/Apple-touch-icon
       (`favicon_url`, anders `logo_url`) en `theme-color` (`accent_color`)
       ook per agency (`lib/branding-metadata.ts`, `generateMetadata`/
       `generateViewport` in de (portal)/(admin)-layouts); TDV blijft de
       fallback en is wat /login, /register en de landingspagina tonen.
       Bewust TDV-vast gebleven: `opengraph-image.png`/OG-tags — crawlers
       komen zonder sessie binnen, dus per-agency kan daar pas met een eigen
       domein per agency (`agencies.custom_domain`). Ook het PWA-manifest
       (`app/manifest.ts`: naam, icoon, `theme_color`) volgt de agency van
       de ingelogde gebruiker, want de manifest-fetch draagt de sessie mee
       (`crossorigin="use-credentials"`); anoniem of zonder eigen branding
       blijft het TDV. Het favicon is apart te uploaden in
       `/admin/settings` → Branding (PNG/SVG/ICO, hoogstens 512 KB,
       zelfde bucket `agency-logos`); zonder favicon geldt het logo.
6. [ ] Facturatie via **Billit** (niet Stripe — bewuste keuze: geen
       betaalprovider/kaartincasso, agency's kiezen maand/kwartaal/jaar-ritme,
       het systeem maakt en verstuurt zelf facturen via de Billit API,
       betaling via overschrijving). Vereist een `BILLIT_API_KEY` in Vercel
       zodra deze stap gebouwd wordt.

## Performance

`vercel.json` pint serverless functions op `fra1` (Frankfurt) vast. Het
Supabase-project draait in `eu-central-2` (Zürich) — zonder deze pin viel
Vercel terug op zijn default `iad1` (US-oost), wat elke server-side
Supabase-call (elke paginalaad, elke Server Action) een transatlantische
heen-en-terugreis liet maken in plaats van een paar honderd kilometer. Dat
was de hoofdoorzaak van een traag aanvoelend portaal — niet iets dat een
andere hostingprovider zou oplossen, wel iets dat elke andere EU-gehoste
backend al automatisch goed zou hebben.

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

De huisstijl volgt de **huisstijlrichtlijnen van tdv. marketing (v1.1)**,
opgesteld door de design-sessie:

- `tailwind.config.ts`: alle kleurrollen (`canvas`, `surface` + `-sunken`/
  `-raised`, `border` + `-strong`, `ink` #282828 + `-muted`/`-subtle`), de
  statuskleuren `new`/`progress`/`waiting`/`done`/`danger` (elk met `soft` en
  `on` voor pills), titelgroottes (`text-display`/`h1`/`h2`/`h3`/`label`),
  radius en schaduwen. Componenten gebruiken nooit hex-codes.
- `lib/brand/accent.ts`: leidt uit één accentkleur (`agencies.accent_color`,
  anders TDV-terracotta) alle accent-tokens af — `accent`, `accent-fg` (wit of
  #282828 volgens luminantie), `accent-dark` (hover), `accent-soft`,
  `accent-text` — volgens de HSL-regel uit de richtlijnen, met gegarandeerd
  WCAG AA. Te lichte kleuren worden automatisch verdonkerd. In
  `/admin/settings` → Branding toont het formulier live wat het portaal met
  de gekozen kleur doet (knop en link, licht en donker), met een melding
  als de kleur verdonkerd wordt.
- `app/globals.css`: de basisklassen `.btn-*`, `.input`, `.card`,
  `.focus-ring`, `.link`.
- `components/brand/`: het woordmerk en monogram als React-component (letters
  in `currentColor`, punt altijd terracotta) en `AgencyLogo` (agency-logo →
  agency-naam → TDV-woordmerk).
- Titels: Epilogue 600, kleine letters met punt (`brandTitle()` in
  `lib/utils.ts` doet dat voor dialog- en lege-staat-titels). Pagina- en
  sectietitels in de app staan rechtstreeks zo in de code ("dashboard.",
  "vraagt je aandacht."): paginatitel `font-display text-h2 sm:text-h1`,
  sectietitel `font-display text-h3`. Dynamische titels (een projectnaam,
  klantnaam, …) blijven zoals ingevoerd.
- Kaarten krijgen geen gekleurde zijbalk; status toont een `Badge`.
- Dark mode: standaard volgt het portaal de systeeminstelling; in
  `/settings` → Weergave kiest de gebruiker Systeem, Licht of Donker. De
  keuze staat in de cookie `tdv-theme` (`lib/theme.ts`) en de
  (portal)/(admin)-layout zet de class server-side op haar wrapper (`dark`
  of `theme-system`), dus geen lichte flits bij het laden. De publieke
  pagina's (landing, /login, /register) blijven altijd licht.
