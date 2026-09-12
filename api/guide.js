// The house guide a Maicasa owner hands to their housesitter.
//
// The guide itself is rendered by a Supabase edge function, and this route
// exists only because that function's output cannot be given to a browser:
// Supabase's gateway rewrites an edge function's `text/html` to `text/plain`
// and attaches `x-content-type-options: nosniff` and
// `content-security-policy: default-src 'none'; sandbox`, so the URL shows a
// sitter the markup as source. A JSON response from the same project is
// untouched, so it is HTML specifically, and no header the function sets
// escapes it.
//
// So we fetch it from our own domain and re-emit it with headers we choose.
// Nothing about the guide is generated here: one renderer still produces the
// web page and the emailed copy, and they cannot drift.
//
// Reached as https://maisoftware.app/guide?token=... (see the rewrite in
// vercel.json). The token is a key to somebody's house — it opens a page
// carrying lockbox and alarm codes and a wifi password — so this route
// caches nothing, refers nothing, and is never indexed.
//
// CommonJS and the (req, res) signature on purpose. This repo is a static
// site with no package.json, so Vercel compiles anything ESM here down to
// CommonJS and ignores an `export const config = {runtime: 'edge'}` while
// doing it — the first cut of this file was written as an edge function and
// silently built as a Node lambda instead. Adding a package.json to force
// ESM would change how the whole site builds, for a page one sitter opens
// occasionally. So: the runtime the builder was always going to give us,
// written the way that runtime expects.

const SHARE_ENDPOINT =
  'https://hxojdpiwwebwywpahgdx.supabase.co/functions/v1/house-guide-share';

// Permissive enough to survive a change of token format, strict enough that
// nothing reaches the upstream query string but an opaque id.
const TOKEN_SHAPE = /^[A-Za-z0-9._~-]{16,128}$/;

const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  // The guide is markup and inline styles — it runs no script and posts
  // nowhere, so say so. Images are the owner's photos, signed by Supabase.
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
        'This link is missing its code, or the code has been mangled in transit. Ask whoever sent it to share it again.',
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
    console.error('[guide] upstream unreachable', {
      message: err instanceof Error ? err.message : String(err),
    });
    send(
      req,
      res,
      502,
      noticeHtml(
        "Can't load the guide",
        'The guide is temporarily unreachable. Try again in a moment.',
      ),
    );
    return;
  }

  const body = await upstream.text();
  // The status is passed through so a revoked, ended or expired link still
  // reads as dead rather than as an empty page. The upstream's own headers
  // are dropped entirely — its content type and sandbox policy are the whole
  // reason this route exists.
  send(req, res, upstream.status, body);
};
