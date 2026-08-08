# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TDV Client Portal — a Next.js 14 (App Router) multi-tenant client portal for a marketing agency (TDV), backed by Supabase (Postgres + Auth + Storage). This is a **working scaffold, not a finished app**: auth, tenancy, DB schema/RLS, routing, and one fully-wired module (projects) exist end-to-end. Other modules are stubbed routes waiting to be built following the same pattern. Comments in the source (in Dutch) explain architectural intent — read them, they're load-bearing documentation, not filler.

Docs, code comments, and UI copy are in Dutch. Keep new user-facing copy in Dutch; code identifiers stay in English.

## Commands

```bash
npm run dev         # start dev server
npm run build        # production build
npm run lint          # eslint .
npm run typecheck     # tsc --noEmit
npm run db:types       # regenerate types/database.types.ts from the live Supabase schema (requires SUPABASE_PROJECT_ID env var + supabase CLI login/link)
```

There is no test suite configured in this repo yet.

Local setup (from README):
```bash
cp .env.example .env.local     # fill in Supabase + Anthropic keys
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push            # applies supabase/migrations/*.sql
npm run db:types
```

## Core architectural rule: RLS in the database, not `if` in React

Every client-owned table hangs off `companies.id`. A single pair of Postgres helper functions — `is_tdv_staff()` and `current_company_id()` (defined in [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql)) — backs every RLS policy across every table. This is the single most important invariant in the codebase:

- **Never filter by `company_id` in application code based on something the client sent.** [lib/data/*.ts](lib/data/) files intentionally take no `companyId` parameter. The signed-in user's session carries their identity; Postgres enforces tenant isolation via RLS. A bug in a React component or query can never leak company A's data to company B, because the database — not the UI — refuses the query.
- When adding a new module, add its RLS policies to a new migration following the `is_tdv_staff() or company_id = current_company_id()` (or the join-based `exists (...)` variant for child tables) pattern already used for every existing table.
- The one deliberate exception: `ai_documents` (the RAG knowledge base) has **no client-facing SELECT policy at all**. The only access path is [app/api/ai/chat/route.ts](app/api/ai/chat/route.ts), which resolves `company_id` server-side from the authenticated session and passes it as a mandatory parameter to the `match_ai_documents` RPC. Don't add a direct client read path to this table.

## Auth & session flow

- [middleware.ts](middleware.ts) → [lib/supabase/middleware.ts](lib/supabase/middleware.ts) `updateSession()` runs on every request (except static assets and `/api/webhooks`, which is signature-authenticated instead of session-authenticated). It refreshes the Supabase session cookie, redirects unauthenticated users to `/login`, and does an early role check for `/admin/*` routes.
- Admin routes get a **second**, authoritative role check in [app/(admin)/admin/layout.tsx](app/(admin)/admin/layout.tsx) — the middleware check is defense-in-depth, not the source of truth. Follow this double-check pattern for any new admin-only surface.
- [lib/supabase/server.ts](lib/supabase/server.ts) exports two clients:
  - `createClient()` — per-request, RLS-bound client for Server Components/Route Handlers/Server Actions. Always call fresh; never module-scope it.
  - `createAdminClient()` — service-role client that **bypasses RLS entirely**. Only use in server contexts that have already verified the caller is TDV staff (admin routes, cron, webhooks).

## Route structure

- `app/(auth)/login/` — public auth routes.
- `app/(portal)/` — everything behind login, shared sidebar layout: `dashboard/ projects/ tickets/ content-planning/ files/ ai-assistant/ notifications/ settings/`.
- `app/(admin)/admin/` — TDV-staff-only, own layout + role check (see above). Only `/admin/clients` is built out; other admin nav items are stubs.
- `app/api/ai/chat/` — RAG chat endpoint (see below).
- `app/api/webhooks/supabase/` — placeholder for Storage/Auth webhooks, excluded from session middleware.

## Data access layer

`lib/data/<module>.ts` — one file per module, server-only (`import "server-only"`), thin wrappers around Supabase queries that rely entirely on RLS for tenant scoping. When building out a new module (feedback/deliverables, content planning, files, notifications — see README for the full list), replicate the shape of [lib/data/projects.ts](lib/data/projects.ts): plain async functions, no `companyId` args, throw on `error` with a Dutch message, cast/return typed domain objects from [types/domain.ts](types/domain.ts).

## AI assistant / RAG

[app/api/ai/chat/route.ts](app/api/ai/chat/route.ts) flow:
1. Auth via the RLS-bound server client; resolve `company_id` from the caller's `profiles` row (never trust a client-supplied company id).
2. Embed the latest user message via `embedText()` — currently calls OpenAI's embeddings endpoint (`EMBEDDINGS_API_KEY`, `AI_EMBEDDINGS_MODEL`); pluggable, since Anthropic doesn't expose an embeddings API. The pgvector column is sized for 1536-dim embeddings — if you change embedding models/dimensions, update [supabase/migrations/0002_ai_search.sql](supabase/migrations/0002_ai_search.sql) too.
3. Vector search via the `match_ai_documents` RPC, filtered by `company_id` (belt-and-suspenders on top of the missing SELECT policy).
4. Call the Anthropic Messages API directly via `fetch` (no SDK dependency) with retrieved chunks as system-prompt context; fails soft (answers without context) if retrieval errors.
5. Persist both turns to `ai_chat_messages`.

The ingest pipeline that populates `ai_documents` from projects/tickets/invoices does not exist yet — only the retrieval side is wired up.

## Types

- [types/database.types.ts](types/database.types.ts) is a **placeholder** — regenerate it with `npm run db:types` once a real Supabase project is linked; don't hand-edit it.
- [types/domain.ts](types/domain.ts) holds hand-written convenience types (`Profile`, `Project`, `Ticket`, `ContentItem`, etc.) used across the UI so the scaffold is readable without a live DB connection. Once `db:types` has run, these could mostly become aliases of `Database["public"]["Tables"][...]["Row"]`, but are kept explicit for now.

## Styling

[tailwind.config.ts](tailwind.config.ts) holds TDV's real brand tokens, extracted from the live marketing site (thomasdevoldere.be): warm cream canvas (`#F4F0EE`), warm near-black ink, terracotta accent (`#AF4B2F`). Fonts mirror the same site's pairing: Inter for body copy, Epilogue for headings (see [app/layout.tsx](app/layout.tsx)). Every component reads color via these tokens, so a future refresh from an official brand guide is still a one-file change; don't hardcode colors in components.

## Extending a stub module

Every unbuilt module (feedback/deliverables, content planning, files, notifications, most of `/admin/*`) already has its schema and RLS policies in [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql). Building it out means: add `lib/data/<module>.ts` (RLS-trusting queries, no manual tenant filtering) + a route under `app/(portal)/<module>/` (or `app/(admin)/admin/<module>/`), matching the projects module's pattern.
