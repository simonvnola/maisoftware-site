// /api/subscribe.js
//
// POST { email } — captures a newsletter subscriber to a Vercel Blob.
// Append-only list of { email, subscribed_at }, de-duplicated. No email is
// sent yet — actual delivery is a fast-follow; for now we just collect.

import { list, put } from '@vercel/blob';

const SUBS_BLOB = 'subscribers.json';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort in-memory rate limit. Serverless instances are ephemeral so this
// only throttles bursts hitting the same warm instance — basic abuse defence,
// not a guarantee.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests — try again shortly.' });
  }

  let email;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    email = String(body.email || '').trim().toLowerCase();
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const { blobs } = await list({ prefix: SUBS_BLOB });
    const blob = blobs.find((b) => b.pathname === SUBS_BLOB);

    let subs = [];
    if (blob) {
      const r = await fetch(blob.url, { cache: 'no-store' });
      if (r.ok) {
        const parsed = await r.json();
        if (Array.isArray(parsed)) subs = parsed;
      }
    }

    if (subs.some((s) => s && s.email === email)) {
      return res.status(200).json({ success: true, already_subscribed: true });
    }

    subs.push({ email, subscribed_at: new Date().toISOString() });

    await put(SUBS_BLOB, JSON.stringify(subs), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Subscription storage unavailable. Please try later.' });
  }
}
