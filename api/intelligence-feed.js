// /api/intelligence-feed.js
//
// GET — returns the cached intelligence feed JSON. Fast, no AI: it only reads
// the pre-computed blob the weekly cron (/api/run-scan) writes. This is what
// the public page calls on load.

import { list } from '@vercel/blob';

const FEED_BLOB = 'intelligence-feed.json';
const EMPTY = { generated_at: null, items: [] };

export default async function handler(req, res) {
  // The feed only changes weekly — let the CDN cache it for an hour and serve
  // stale while revalidating.
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  try {
    const { blobs } = await list({ prefix: FEED_BLOB });
    const blob = blobs.find((b) => b.pathname === FEED_BLOB) || blobs[0];
    if (!blob) return res.status(200).json(EMPTY);

    const r = await fetch(blob.url, { cache: 'no-store' });
    if (!r.ok) return res.status(200).json(EMPTY);

    const data = await r.json();
    return res.status(200).json(data && Array.isArray(data.items) ? data : EMPTY);
  } catch (e) {
    // No blob store configured yet, or transient error — serve the empty state
    // so the page renders cleanly instead of erroring.
    return res.status(200).json(EMPTY);
  }
}
