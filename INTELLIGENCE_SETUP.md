# maiconflicts — Regulatory Intelligence Feed: Setup

This adds a free, public regulatory enforcement feed at
**`/maiconflicts/intelligence/`** plus three Vercel serverless functions in
`/api`. The static site keeps serving exactly as before — **no build step was
introduced**. The only new npm dependency (`@vercel/blob`) is installed by
Vercel automatically for the serverless functions; it does not touch the static
HTML.

## Architecture

```
maiconflicts/intelligence/index.html   public feed page (static HTML/CSS/vanilla JS)
api/intelligence-feed.js               GET  — returns the cached feed JSON (fast, no AI)
api/run-scan.js                        cron — runs the weekly scan, writes to Blob
api/subscribe.js                       POST — captures an email subscriber to Blob
vercel.json                            weekly cron + existing header config
package.json                           declares @vercel/blob (functions only)
.github/workflows/weekly-scan.yml      fallback scheduler (use only if Vercel Cron is unavailable)
```

The page loads `/api/intelligence-feed` and renders cards client-side.
Jurisdiction and conduct-type filters run entirely in the browser. The feed
itself is regenerated once a week by the cron-only `/api/run-scan`, which is the
only place the Anthropic API is called — **there are no per-visitor AI calls.**

## Environment variables (set in Vercel → Project → Settings → Environment Variables)

| Variable                | Required | Purpose |
|-------------------------|----------|---------|
| `ANTHROPIC_API_KEY`     | Yes      | Anthropic API key. Server-side only — used solely by `/api/run-scan`. Never exposed to the client or committed to the repo. |
| `BLOB_READ_WRITE_TOKEN` | Yes      | Auto-provisioned when you enable Vercel Blob on the project (see below). Used by all three functions to read/write the feed and subscriber blobs. |
| `CRON_SECRET`           | Yes      | A random secret protecting `/api/run-scan` from manual abuse. Generate with e.g. `openssl rand -hex 32`. Vercel automatically sends it as `Authorization: Bearer <CRON_SECRET>` on cron invocations. |

After adding or changing env vars, redeploy so the functions pick them up.

## Enable Vercel Blob

1. Vercel dashboard → your project → **Storage** tab → **Create Database** →
   **Blob** → create the store and connect it to this project.
2. Vercel injects `BLOB_READ_WRITE_TOKEN` into the project automatically.
3. Redeploy (or it takes effect on the next deploy).

The feed is stored as the public blob `intelligence-feed.json`; subscribers as
`subscribers.json`.

## Populate the feed (first run)

Vercel Cron runs `/api/run-scan` every Monday at 06:00 UTC. To populate the feed
immediately without waiting, trigger it manually with the `CRON_SECRET`:

```bash
curl -X POST https://maisoftware.app/api/run-scan \
  -H "Authorization: Bearer $CRON_SECRET"
```

(Use your production domain.) A successful run returns
`{ "success": true, "item_count": N, ... }` and writes `intelligence-feed.json`.
The scan fans out across 14 sources with web search, so it can take 1–4 minutes.

Until the first scan completes, the page shows a friendly empty state.

## Subscribers — where they're stored and how to export

Subscribers are appended to the public blob `subscribers.json` as
`[{ "email": "...", "subscribed_at": "ISO-8601" }, ...]`, de-duplicated.

Export options:

- **Vercel CLI:** `vercel blob list` to find the blob, then `curl` its URL.
- **Dashboard:** Storage → Blob → open `subscribers.json`.

> **Privacy note / fast-follow:** Vercel Blob currently only supports `public`
> access, so `subscribers.json` is reachable by anyone who knows its
> (unguessable, store-id-scoped) URL. Before promoting this widely, move
> subscriber capture to a private datastore (Postgres / KV) or a real email
> provider (Resend, Loops, Mailchimp). Email sending is not yet wired up — the
> endpoint only captures addresses for later.

## Cron availability

`vercel.json` defines a weekly cron (`0 6 * * 1`, Mondays 06:00 UTC). **Vercel
Cron requires the Pro plan** for arbitrary schedules; the free Hobby plan is
limited (roughly once-daily, and historically Pro-only for custom schedules).

If Cron isn't available on your plan, use the GitHub Actions fallback at
`.github/workflows/weekly-scan.yml`, which curls `/api/run-scan` on a weekly
schedule. To use it:

1. Add two GitHub repo secrets (Settings → Secrets and variables → Actions):
   - `SCAN_URL` — e.g. `https://maisoftware.app/api/run-scan`
   - `CRON_SECRET` — the **same** value as the Vercel env var.
2. The workflow runs weekly and can also be triggered manually from the Actions
   tab ("Run workflow").

If you use the GitHub Actions fallback, you can remove the `crons` block from
`vercel.json` to avoid double-running — but leaving both is harmless (the scan
just overwrites the same blob).

## Notes / deviations from the original spec

- **Source file not available.** The original `intelligenceScanner.ts` lives in
  a separate repo (`/Users/simonnola/maiconflicts2`) that wasn't present in the
  build environment. The 14 sources, extraction prompt, de-duplication, and
  timeline grouping in `api/run-scan.js` are a faithful reimplementation of the
  behaviour described in the spec, not a line-by-line port. Sources 1–9 match
  the spec verbatim; 10–14 (HKMA, FINRA, AUSTRAC, US DOJ, a global
  Regulatory-News scan) fill out the 14 with recognised regulators/news. Each
  item's jurisdiction is classified by the AI into one of the nine filterable
  codes, so a global news source still produces correctly-tagged items.
- **Web search tool header.** The Anthropic web search tool `web_search_20250305`
  is now GA and does **not** require the `anthropic-beta: web-search-2025-03-05`
  header, so the scan omits it. Model is `claude-sonnet-4-6` as specified.
- **Copyright discipline.** The extraction prompt instructs the model to write
  original 2–3 sentence summaries (never reproduce article text) and to include
  at most one quote per item, under 15 words. The function additionally caps any
  `relevant_excerpt` to 15 words as a backstop.
