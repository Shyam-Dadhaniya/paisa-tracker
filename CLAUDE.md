# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PaisaTrack — a local-first expense journal PWA. Data lives in IndexedDB (Dexie) and optionally syncs to Supabase. SMS bank messages can be parsed into expenses via an AI endpoint with a regex fallback.

## Commands

```bash
npm run dev        # vite dev server, localhost:5173 (note: /api/* not served — see below)
npm run build      # tsc -b && vite build, output to dist/
npm run preview    # serve production build
npm run lint       # eslint . (flat config in eslint.config.js)
npm run test       # vitest run (single pass)
npm run test:watch # vitest in watch mode
```

Tests use Vitest + happy-dom (config in `vitest.config.ts`, setup in `src/__tests__/setup.ts`). Specs live alongside code under `src/**/__tests__/` — currently covering the SMS regex/patterns, AI parser, Zod form schema, Dexie migrations, the sync engine, and the `useFilteredExpenses` hook.

- `/api/parse-sms.ts` is a Vercel serverless function and is NOT served by plain `npm run dev`. However, `vite.config.ts` injects a dev-only middleware (`devApiPlugin`) that serves `/api/parse-sms` locally using `GROQ_API_KEY` from `.env.local` (Groq's `llama-3.1-8b-instant`), separate from the production Anthropic-based handler. If `GROQ_API_KEY` isn't set, the dev endpoint 500s and the app falls back to the regex parser (`src/services/smsRegex.ts`).

## Environment variables (`.env.local`)

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — client-side Supabase config (publishable key, RLS-protected).
- `ANTHROPIC_API_KEY` — server-only, used by production `/api/parse-sms.ts` on Vercel.
- `GROQ_API_KEY` — used only by the local dev SMS-parsing middleware in `vite.config.ts`.

## Architecture

### Path alias
`@/*` → `src/*` (configured in both `tsconfig.json` and `vite.config.ts`).

### Data layer (`src/services/db.ts`)
Single Dexie database `paisatrack` with three tables: `expenses`, `customCategories`, `paymentSources`. Schema changes go through incrementing `db.version(n).stores({...})` blocks, with `.upgrade()` migrations when existing records need backfilling (e.g. v4 backfills `expense.time`). When adding a field to `Expense`/`CustomCategory`/`PaymentSource` (`src/types/index.ts`), add a new versioned schema block rather than editing an existing one.

### State (Zustand stores in `src/store/`)
- `expenseStore` — CRUD for expenses. All mutations write to Dexie first, then call `triggerSync()` (fire-and-forget, only if signed in and online).
- `categoryStore` — merges built-in `CATEGORIES` (`src/utils/categories.ts`) with user-defined `customCategories` from Dexie. `findCategory(id)` is the lookup helper used throughout the UI, falling back to `'other'`.
- `paymentSourceStore` — user's banks/cards, loaded at app start.
- `authStore` — wraps Supabase auth session; `init()` is a no-op if Supabase isn't configured (`isSupabaseConfigured` in `src/services/supabase.ts`).

App-level bootstrapping happens once in `src/App.tsx`: `initAuth`, `loadCustomCategories`, `loadPaymentSources` on mount.

### Sync engine (`src/services/syncEngine.ts`)
`syncNow(userId)` is the single entry point, called by `triggerSync()` and by `useSync` (on interval/visibility/online events). For each of expenses, customCategories, and paymentSources it:
1. Pushes local rows that are dirty (`!syncedAt || syncedAt < updatedAt`) via `upsert(onConflict: 'id')`.
2. Pulls remote rows changed since `lastPulledAt` (tracked in `localStorage` under `paisatrack-sync-meta`) and writes them locally if the remote `updated_at` is newer.

Conflict resolution is last-write-wins on `updatedAt`. Soft delete: `expenses.deleted=true` propagates the delete to Supabase; once pulled back as `deleted: true`, the local row is hard-deleted. Each remote table has its own `toRow`/`fromRow` mapping between camelCase (local `Expense`) and snake_case (Supabase columns) — keep these in sync when changing `src/types/index.ts`.

### SMS parsing (`src/services/aiParser.ts`)
`parseSms(text)` posts to `/api/parse-sms`, expects `{ result: ParsedSms }`, and falls back to `parseSmsRegex` (`src/services/smsRegex.ts`) on any network/parse failure. The category enum returned by AI parsers must map onto `CategoryId`s from `src/utils/categories.ts` (built-ins) or `'other'`.

### Routing
Standard React Router setup in `src/App.tsx`. All routes render alongside a persistent `BottomNav`. Unknown paths redirect to `/`.

### Styling
Tailwind, with custom theme tokens like `bg`/`text` (see `tailwind.config.cjs`).
