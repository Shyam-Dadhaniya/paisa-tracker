// Vercel serverless function — proxies to Groq so the API key never leaves the server.

interface Body {
  smsText?: string;
}

const CATEGORIES = ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'other'];

const SYSTEM_PROMPT = `You extract structured expense data from Indian bank/payment SMS messages.
Return ONLY a JSON object — no prose, no markdown fences — with these fields:
{
  "amount": number (in rupees, decimal allowed),
  "merchant": string (concise, e.g. "Zomato", "Uber", "Amazon"; if unknown use "Unknown"),
  "category": one of ${CATEGORIES.map((c) => `"${c}"`).join(' | ')},
  "note": string (short, optional context; empty string if none),
  "confidence": number (0-1)
}
Rules:
- If the message is a credit/refund/OTP/balance-only message (not a debit), set amount to 0 and confidence below 0.3.
- "food" = restaurants/food delivery/groceries. "transport" = Uber/Ola/fuel/metro. "shopping" = Amazon/Flipkart/retail. "bills" = electricity/recharge/rent/subscriptions. "entertainment" = movies/streaming/games. "health" = pharmacy/doctor/hospital. "other" = anything else.
- Always pick the closest category; never invent new ones.`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server missing GROQ_API_KEY' }, 500);
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const smsText = (body.smsText ?? '').trim();
  if (!smsText) return json({ error: 'smsText required' }, 400);
  if (smsText.length > 2000) return json({ error: 'smsText too long' }, 413);

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
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

    if (!upstream.ok) {
      const text = await upstream.text();
      return json({ error: 'Upstream error', detail: text.slice(0, 500) }, 502);
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return json({ error: 'Model returned no JSON', raw }, 502);

    const parsed = JSON.parse(match[0]);
    if (!CATEGORIES.includes(parsed.category)) parsed.category = 'other';
    parsed.amount = Number(parsed.amount) || 0;
    parsed.merchant = String(parsed.merchant ?? 'Unknown').slice(0, 60);
    parsed.note = String(parsed.note ?? '').slice(0, 200);

    return json({ result: parsed });
  } catch (err) {
    return json({ error: 'Server error', detail: String(err).slice(0, 300) }, 500);
  }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const config = { runtime: 'edge' };
