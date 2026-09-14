/**
 * Learning Log coach relay: a Cloudflare Worker that holds the school's
 * Anthropic API key so students never do. Deploy once per school (or per
 * department); rotate CLASS_TOKENS every term.
 *
 * Secrets (npx wrangler secret put NAME):
 *   ANTHROPIC_API_KEY   the school's key (an adult's Console account)
 *   CLASS_TOKENS        comma separated tokens, one per class or teacher
 * Variables (wrangler.toml [vars]):
 *   ALLOWED_ORIGINS     comma separated page origins, e.g. https://harmanjohll.github.io
 *   MODEL               default model when the page does not name an allowed one
 * Optional binding: LIMITER (rate limit binding, see wrangler.toml)
 *
 * The Worker forwards only requests that look like the Learning Log coach
 * request (the app's system prompt marker, one user message, capped
 * max_tokens, an allowed model) and returns Anthropic's JSON unchanged, so
 * the page code is identical whether a key or a relay is used.
 */
const ALLOWED_MODELS = ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'];
const MARKER = 'You are a reflective learning coach';

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = {
      'Access-Control-Allow-Origin': allowed.length === 0 || allowed.includes(origin) ? (origin || '*') : 'null',
      'Access-Control-Allow-Headers': 'content-type, x-class-token, x-class-code',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Vary': 'Origin'
    };
    const json = (obj, status) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'content-type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
    if (allowed.length && !allowed.includes(origin)) return json({ error: 'origin not allowed' }, 403);

    const token = req.headers.get('x-class-token') || '';
    const tokens = (env.CLASS_TOKENS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!token || !tokens.includes(token)) return json({ error: 'class token not recognised' }, 403);

    if (env.LIMITER) {
      const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.LIMITER.limit({ key: token + ':' + ip });
      if (!success) return json({ error: 'too many requests, wait a minute' }, 429);
    }

    let body;
    try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
    if (typeof body.system !== 'string' || !body.system.startsWith(MARKER)) return json({ error: 'not a coach request' }, 400);
    if (!Array.isArray(body.messages) || body.messages.length !== 1 || body.messages[0].role !== 'user') return json({ error: 'one user message only' }, 400);
    if (typeof body.messages[0].content !== 'string' || body.messages[0].content.length > 12000) return json({ error: 'entry too long' }, 400);
    body.model = ALLOWED_MODELS.includes(body.model) ? body.model : (env.MODEL || 'claude-opus-5');
    body.max_tokens = Math.min(Number(body.max_tokens) || 1024, 1500);
    delete body.stream; delete body.tools; delete body.mcp_servers;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'server-side-fallback-2026-07-01'
      },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    return new Response(text, { status: r.status, headers: { ...cors, 'content-type': 'application/json' } });
  }
};
