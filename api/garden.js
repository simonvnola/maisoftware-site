// The garden brief a Maicasa owner sends to gardeners for quotes.
//
// Same job as api/guide.js, for the same reason: the page is rendered by a
// Supabase edge function (garden-brief-share), and Supabase's gateway serves
// an edge function's HTML as text/plain under a sandbox CSP, so its own URL
// shows a browser the markup as source. We fetch it from our own domain and
// re-emit it with headers we choose. Nothing about the brief is generated
// here.
//
// Reached as https://maisoftware.app/garden?token=... (see the rewrite in
// vercel.json). The token opens a page with a property's address and photos
// of its garden, so this route caches nothing, refers nothing, and is never
// indexed.
//
// CommonJS and the (req, res) signature on purpose: this repo has no
// package.json, so Vercel compiles ESM here down to CommonJS and drops an
// edge runtime config while doing it. See the note in api/guide.js.

const SHARE_ENDPOINT =
  'https://hxojdpiwwebwywpahgdx.supabase.co/functions/v1/garden-brief-share';

// Permissive enough to survive a change of token format, strict enough that
// nothing reaches the upstream query string but an opaque id.
const TOKEN_SHAPE = /^[A-Za-z0-9._~-]{16,128}$/;

const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  // Markup and inline styles only. Images are the owner's photos, signed by
  // Supabase.
  'Content-Security-Policy': [
    "default-src 'none'",
    'img-src https: data:',
    "style-src 'unsafe-inline'",
    "script-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; '),
};

function noticeHtml(title, body) {
  return `<!DOCTYPE html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width, initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#F6F2EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;"><div style="max-width:480px;margin:0 auto;padding:64px 24px;"><h1 style="margin:0 0 12px;font-size:21px;font-weight:800;color:#2A2620;">${title}</h1><p style="margin:0;font-size:15px;line-height:1.7;color:#5A5248;">${body}</p></div></body></html>`;
}

function send(req, res, status, body) {
  res.statusCode = status;
  for (const [name, value] of Object.entries(HEADERS)) {
    res.setHeader(name, value);
  }
  // A HEAD request gets the headers and nothing else.
  res.end(req.method === 'HEAD' ? undefined : body);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(req, res, 405, noticeHtml('Not available', 'This page can only be opened.'));
    return;
  }

  // req.query is Vercel's, but the route is also reachable directly, so fall
  // back to the URL rather than trusting the helper to be there.
  const fromHelper = req.query && req.query.token;
  const token = String(
    fromHelper ??
      new URL(req.url, 'https://maisoftware.app').searchParams.get('token') ??
      '',
  ).trim();

  if (!token || !TOKEN_SHAPE.test(token)) {
    send(
      req,
      res,
      400,
      noticeHtml(
        'Nothing to show',
        'This link is missing its code, or the code got cut off. Ask whoever sent it to share it again.',
      ),
    );
    return;
  }

  let upstream;
  try {
    // Built from the token alone. Forwarding the caller's query string would
    // turn this route into an open proxy onto the project's functions.
    upstream = await fetch(`${SHARE_ENDPOINT}?token=${encodeURIComponent(token)}`, {
      headers: { accept: 'text/html' },
    });
  } catch (err) {
    console.error('[garden] upstream unreachable', {
      message: err instanceof Error ? err.message : String(err),
    });
    send(
      req,
      res,
      502,
      noticeHtml(
        "Can't load the brief",
        'Try again in a moment.',
      ),
    );
    return;
  }

  const body = await upstream.text();
  // The status is passed through so a link the owner turned off still reads
  // as dead rather than as an empty page. The upstream's own headers are
  // dropped entirely: its content type and sandbox policy are the whole
  // reason this route exists.
  send(req, res, upstream.status, body);
};
