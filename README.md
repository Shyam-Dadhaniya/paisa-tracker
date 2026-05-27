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
Copy `.env.local.example` to `.env.local` and paste your Anthropic key:
```
ANTHROPIC_API_KEY=sk-ant-...
```
This key is only used by the serverless function `/api/parse-sms.ts` — never bundled into the client.
To test the SMS parser locally you need `vercel dev` (regular `npm run dev` won't serve `/api/*`).
The regex fallback works without the key.

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
vercel env add ANTHROPIC_API_KEY production   # paste your key when asked
vercel --prod       # deploy to production
```
You'll get an `https://paisatrack-xxx.vercel.app` URL.

### Option B — GitHub + Vercel dashboard
1. `git init && git add . && git commit -m "initial"`
2. Create a new repo on github.com, push to it.
3. Go to vercel.com → Add New Project → Import the repo.
4. Framework: Vite (auto-detected).
5. Under **Environment Variables**, add `ANTHROPIC_API_KEY` = your key.
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

## Next phases
- **Phase 1.5** — Claude SMS paste parser (needs Anthropic API key + serverless function on Vercel).
- **Phase 2** — Supabase auth + cloud sync (eliminates the 7-day data loss risk).
- **Phase 3** — Charts (Recharts is already installed), recurring expenses, budgets.

## Stack
React 18 · TypeScript · Vite · Tailwind · React Router · Zustand · Dexie · React Hook Form · vite-plugin-pwa · Lucide · date-fns
