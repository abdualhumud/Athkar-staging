/**
 * Athkar Daily Reminder — Cloudflare Worker
 *
 * Secrets (set via `wrangler secret put`):
 *   WHATSAPP_TOKEN        — Meta permanent system user token
 *   WHATSAPP_PHONE_ID     — Meta Phone Number ID
 *   WEBHOOK_VERIFY_TOKEN  — Any random string for Meta webhook verification
 *   ALLOWED_ORIGIN        — https://staging.athkarr.com  OR  https://athkarr.com
 *
 * KV Binding:
 *   SUBSCRIBERS           — namespace bound in wrangler.toml
 *   Key:   "sub:+966501234567"
 *   Value: JSON { phone, subscribedAt, active }
 */

const WA_API = 'https://graph.facebook.com/v21.0';

const MORNING_TEMPLATE = 'adhkar_sabah';
const EVENING_TEMPLATE = 'adhkar_masa';

const MORNING_URL = 'https://athkarr.com/sabah-masa/';
const EVENING_URL = 'https://athkarr.com/sabah-masa/';

// ── CORS headers ──────────────────────────────────────────────────────────────
function corsHeaders(origin, allowed) {
  if (!origin || origin !== allowed) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// ── JSON response helper ──────────────────────────────────────────────────────
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

// ── Send a WhatsApp template message ─────────────────────────────────────────
async function sendTemplate(env, to, templateName, urlParam) {
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'ar' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: urlParam }],
        },
      ],
    },
  };

  const resp = await fetch(`${WA_API}/${env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error(`WhatsApp send failed for ${to}: ${err}`);
  }
  return resp.ok;
}

// ── Fetch all active subscriber phone numbers from KV ─────────────────────────
async function getActiveSubscribers(env) {
  const phones = [];
  let cursor = undefined;

  do {
    const result = await env.SUBSCRIBERS.list({
      prefix: 'sub:',
      ...(cursor ? { cursor } : {}),
    });

    for (const key of result.keys) {
      const val = await env.SUBSCRIBERS.get(key.name);
      if (val) {
        try {
          const rec = JSON.parse(val);
          if (rec.active) phones.push(rec.phone);
        } catch (_) {}
      }
    }

    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);

  return phones;
}

// ── Scheduled handler (cron) ─────────────────────────────────────────────────
async function handleScheduled(event, env) {
  const utcHour = new Date().getUTCHours();

  // 04:00 UTC → 07:00 Riyadh (morning)
  // 13:00 UTC → 16:00 Riyadh (evening)
  const isMorning = utcHour === 4;
  const template = isMorning ? MORNING_TEMPLATE : EVENING_TEMPLATE;
  const url = isMorning ? MORNING_URL : EVENING_URL;

  console.log(`[cron] ${isMorning ? 'Morning' : 'Evening'} send — ${new Date().toISOString()}`);

  const subscribers = await getActiveSubscribers(env);
  console.log(`[cron] Sending to ${subscribers.length} subscribers`);

  for (const phone of subscribers) {
    await sendTemplate(env, phone, template, url);
    // 100ms gap — avoids bursting Meta's rate limit
    await new Promise(r => setTimeout(r, 100));
  }
}

// ── HTTP handler ──────────────────────────────────────────────────────────────
async function handleRequest(request, env) {
  const url    = new URL(request.url);
  const origin = request.headers.get('Origin') || '';
  const cors   = corsHeaders(origin, env.ALLOWED_ORIGIN);

  // Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  // ── POST /api/subscribe ────────────────────────────────────────────────────
  if (url.pathname === '/api/subscribe' && request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid JSON' }, 400, cors);
    }

    const phone   = (body.phone   || '').trim();
    const consent = body.consent  === true;

    // E.164 validation: + followed by 7–15 digits
    if (!phone.match(/^\+\d{7,15}$/) || !consent) {
      return json({ error: 'رقم غير صحيح أو الموافقة مفقودة' }, 400, cors);
    }

    const key      = `sub:${phone}`;
    const existing = await env.SUBSCRIBERS.get(key);
    if (existing) {
      const rec = JSON.parse(existing);
      if (rec.active) {
        return json({ status: 'already_subscribed' }, 200, cors);
      }
    }

    await env.SUBSCRIBERS.put(key, JSON.stringify({
      phone,
      subscribedAt: new Date().toISOString(),
      active: true,
    }));

    return json({ status: 'subscribed' }, 200, cors);
  }

  // ── POST /api/unsubscribe ──────────────────────────────────────────────────
  if (url.pathname === '/api/unsubscribe' && request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid JSON' }, 400, cors);
    }

    const phone = (body.phone || '').trim();
    if (!phone.match(/^\+\d{7,15}$/)) {
      return json({ error: 'رقم غير صحيح' }, 400, cors);
    }

    await env.SUBSCRIBERS.delete(`sub:${phone}`);
    return json({ status: 'unsubscribed' }, 200, cors);
  }

  // ── GET /api/webhook — Meta verification handshake ─────────────────────────
  if (url.pathname === '/api/webhook' && request.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode');
    const token     = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === env.WEBHOOK_VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // ── POST /api/webhook — Incoming WhatsApp messages ─────────────────────────
  if (url.pathname === '/api/webhook' && request.method === 'POST') {
    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response('ok', { status: 200 });
    }

    try {
      const msg = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (msg?.type === 'text') {
        const text = (msg.text?.body || '').trim();
        const from = '+' + msg.from;

        // Auto-unsubscribe on keywords
        if (['إلغاء', 'stop', '0', 'الغاء'].includes(text.toLowerCase())) {
          await env.SUBSCRIBERS.delete(`sub:${from}`);
          console.log(`[webhook] Unsubscribed ${from}`);
        }
      }
    } catch (_) {}

    // Always return 200 to Meta — otherwise it retries
    return new Response('ok', { status: 200 });
  }

  return new Response('Not Found', { status: 404 });
}

// ── Export ────────────────────────────────────────────────────────────────────
export default {
  fetch:     handleRequest,
  scheduled: handleScheduled,
};
