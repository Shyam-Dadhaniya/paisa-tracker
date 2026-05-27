# PaisaTrack

Smart expense journal PWA. Local-first storage (IndexedDB) + Claude-powered SMS parsing.
Supabase cloud sync is the next phase.

## What's working
- Add expense (amount, merchant, category, date, note)
- 7 categories: Food, Transport, Shopping, Bills, Fun, Health, Other
- Dashboard: today's spend, monthly total, breakdown by category
- History with category filter, grouped by date, swipe-free delete
- **SMS parser** — paste a bank SMS, Claude Haiku extracts amount/merchant/category. Regex fallback if offline.
- **Clipboard auto-read** — opens the Scan tab and it pre-fills if your clipboard has an SMS.
- CSV export
- Clear all data
- PWA installable (iOS Add to Home Screen)
- Offline-first via IndexedDB (Dexie)

## Environment variables
Copy `.env.local.example` to `.env.local`:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
ANTHROPIC_API_KEY=sk-ant-...
```
- `VITE_*` vars are shipped to the client (safe — Supabase publishable key is public, protected by Row Level Security).
- `ANTHROPIC_API_KEY` is server-only, used by `/api/parse-sms.ts`. Never bundled into the client.
- To test SMS parser locally use `vercel dev` (plain `npm run dev` doesn't serve `/api/*`). Regex fallback works without it.

## Running locally
```bash
npm install
npm run dev          # localhost:5173
npm run build        # production build in dist/
npm run preview      # serve the production build
```

## Deploy to Vercel (gets you HTTPS for iOS install)

### Option A — CLI (fastest)
```bash
npm i -g vercel
cd /Users/shyamdadhaniya/Projects/paisatrack
vercel              # follow prompts, accept defaults
vercel env add ANTHROPIC_API_KEY production       # paste your Anthropic key
vercel env add VITE_SUPABASE_URL production       # paste Supabase URL
vercel env add VITE_SUPABASE_ANON_KEY production  # paste publishable key
vercel --prod       # deploy to production
```
You'll get an `https://paisatrack-xxx.vercel.app` URL.

### Option B — GitHub + Vercel dashboard
1. `git init && git add . && git commit -m "initial"`
2. Create a new repo on github.com, push to it.
3. Go to vercel.com → Add New Project → Import the repo.
4. Framework: Vite (auto-detected).
5. Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your Anthropic key
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase publishable key
6. Click Deploy.

## Install on iPhone
1. Open the deployed `https://...vercel.app` URL in **Safari** (not Chrome — Chrome on iOS can't install PWAs).
2. Tap the Share button → **Add to Home Screen** → Add.
3. The PaisaTrack icon appears on your home screen. Tap it — opens full-screen, no Safari UI.

## Important iOS notes
- iOS clears PWA data after **7 days of inactivity**. Until cloud sync is added (Phase 2), **open the app at least once a week** and export CSV regularly (Settings → Export to CSV).
- Icons are placeholders (flat indigo). Replace `public/icons/icon-192.png`, `icon-512.png`, and `public/apple-touch-icon.png` with proper artwork before you care.

## iOS Shortcut (auto-capture bank SMS)
1. Open **Shortcuts** app on iPhone → **Automation** tab → **+** (top right).
2. **New Automation** → **Message**.
3. Sender: type your bank sender IDs (e.g. `SBIINB`, `HDFCBK`, `ICICIB`). Set "Message contains" to `debited` or leave blank for all.
4. Run Immediately, turn OFF "Notify When Run".
5. Add Action → **Set Clipboard** → set to **Shortcut Input** (the SMS text).
6. Add Action → **Open URL** → paste your deployed URL with `/sms` at the end: `https://your-app.vercel.app/sms`
7. Save.

Now whenever a bank SMS arrives, the Shortcut copies it to clipboard, opens PaisaTrack on the Scan tab, which auto-reads the clipboard and parses with Claude. Tap **Save expense** and done.

## Cloud sync (Supabase)
- Sign in from **Settings → Enable cloud sync** (or /login). Email + password.
- Auto-syncs: on sign-in, every 5 min, when network returns, when tab becomes visible.
- Conflict resolution: last-write-wins on `updatedAt`.
- Soft delete: deleting an expense marks `deleted=true` so the deletion propagates; sync engine clears it locally after the next pull.
- Sync status chip on Dashboard (top right) and in Settings.

## Next phases
- **Phase 2** — Charts (Recharts is already installed), recurring expenses, budgets, search, edit expense.
- **Phase 3** — Multi-currency, receipt photo upload, AI weekly summary.

## Stack
React 18 · TypeScript · Vite · Tailwind · React Router · Zustand · Dexie · React Hook Form · vite-plugin-pwa · Lucide · date-fns
