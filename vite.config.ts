import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

const CATEGORIES = ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'other'];

const SYSTEM_PROMPT = `You extract structured expense data from Indian bank/payment SMS messages.
Return ONLY a JSON object — no prose, no markdown fences — with these fields:
{
  "amount": number (in rupees, decimal allowed),
  "merchant": string (concise; if unknown use "Unknown"),
  "category": one of ${CATEGORIES.map((c) => `"${c}"`).join(' | ')},
  "note": string (short, optional; empty string if none),
  "confidence": number (0-1)
}
Rules: credit/refund/OTP → amount 0, confidence <0.3. food=restaurants/delivery/groceries, transport=Uber/Ola/fuel/metro, shopping=Amazon/Flipkart/retail, bills=electricity/recharge/rent/subscriptions, entertainment=movies/streaming/games, health=pharmacy/doctor/hospital. Always pick closest category.`;

function devApiPlugin(apiKey: string | undefined): Plugin {
  return {
    name: 'dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/parse-sms', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405).end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        if (!apiKey) {
          res.writeHead(500).end(JSON.stringify({ error: 'Missing GROQ_API_KEY in .env.local' }));
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', async () => {
          try {
            const { smsText } = JSON.parse(Buffer.concat(chunks).toString()) as { smsText?: string };
            if (!smsText?.trim()) {
              res.writeHead(400).end(JSON.stringify({ error: 'smsText required' }));
              return;
            }
            const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
              body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                max_tokens: 300,
                temperature: 0,
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  { role: 'user', content: `SMS:\n${smsText}` },
                ],
              }),
            });
            const data = (await upstream.json()) as { choices?: Array<{ message?: { content?: string } }> };
            const raw = data.choices?.[0]?.message?.content ?? '';
            const match = raw.match(/\{[\s\S]*\}/);
            if (!match) { res.writeHead(502).end(JSON.stringify({ error: 'Model returned no JSON' })); return; }
            const parsed = JSON.parse(match[0]);
            if (!CATEGORIES.includes(parsed.category)) parsed.category = 'other';
            parsed.amount = Number(parsed.amount) || 0;
            parsed.merchant = String(parsed.merchant ?? 'Unknown').slice(0, 60);
            parsed.note = String(parsed.note ?? '').slice(0, 200);
            res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ result: parsed }));
          } catch (err) {
            res.writeHead(500).end(JSON.stringify({ error: String(err).slice(0, 300) }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv with '' prefix loads ALL vars (not just VITE_*) so GROQ_API_KEY is available
  const env = loadEnv(mode, process.cwd(), '');
  return {
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  plugins: [
    devApiPlugin(env.GROQ_API_KEY),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'PaisaTrack',
        short_name: 'PaisaTrack',
        description: 'Smart expense journal',
        theme_color: '#6366F1',
        background_color: '#080810',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  server: { host: true },
  };
});
