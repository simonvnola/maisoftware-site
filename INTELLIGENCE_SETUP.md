# maiconflicts — Regulatory Intelligence Feed (static)

A free, public regulatory enforcement feed at **`/maiconflicts/intelligence/`**,
served as **100% static files** — no serverless functions, no Vercel Blob, no
`ANTHROPIC_API_KEY` in production, and **no per-visitor or per-scan API tokens.**

## How it works

```
maiconflicts/intelligence/index.html        static page (HTML/CSS/vanilla JS)
maiconflicts/intelligence/feed.json          the data the page renders (committed, regenerated weekly)
maiconflicts/intelligence/SCAN_ROUTINE.md     the weekly routine a scheduled Claude session follows
vercel.json                                   unchanged — just the apple-app-site-association header
```

- The page fetches the sibling `feed.json` and renders cards entirely
  client-side (jurisdiction + conduct-type filters, timeline grouping). It's a
  plain static file on Vercel's CDN.
- `feed.json` is regenerated **once a week by a scheduled Claude session**, which
  does the web searches, writes the summaries, overwrites `feed.json`, and pushes
  to `main`. Vercel auto-deploys the new file. See `SCAN_ROUTINE.md` for the
  exact routine.
- The subscribe section is a **mailto link** (`hello@maiconflicts.com.au`) — no
  backend needed. Swap in a hosted form (Formspree / Tally / Buttondown) later if
  you want managed capture + sending.

## Why this avoids API tokens

The scan runs as a **Claude Code session**, which uses Claude's built-in web
search under your **Claude subscription** — not metered pay-per-token API calls.
(A GitHub Action calling the Anthropic API *would* burn API tokens, so that's
deliberately not used here.)

## Scheduling the weekly scan

In **Claude Code on the web**, create a scheduled / recurring session on this
repo whose prompt is:

> Follow the routine in `maiconflicts/intelligence/SCAN_ROUTINE.md`.

Set a weekly cadence (e.g. Monday morning). That's it — each run regenerates
`feed.json` and pushes. Docs: https://code.claude.com/docs/en/claude-code-on-the-web

To **populate the feed now**, just run that prompt once in a session (I can do it
for you in this session if you'd like).

## Notes

- **Source logic not ported from the Electron app.** The original
  `intelligenceScanner.ts` lives in a separate repo
  (`/Users/simonnola/maiconflicts2`) that isn't available here. `SCAN_ROUTINE.md`
  is a faithful reimplementation of the described behaviour (14 sources, last-14-
  days window, conduct-type classification, relevance scoring, URL de-dup,
  timeline grouping, original-summary copyright discipline). Sources 1–9 match the
  spec verbatim; 10–14 (HKMA, FINRA, AUSTRAC, US DOJ, a global news scan) round it
  out to 14.
- **Empty state.** Until the first scan runs, `feed.json` has `items: []` and the
  page shows a friendly "not generated yet" message.
- **Copyright discipline** is enforced in the routine: original 2–3 sentence
  summaries, never reproduced article text, at most one quote per item under 15
  words.
