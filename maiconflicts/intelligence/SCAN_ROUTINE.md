# Weekly Regulatory Intelligence Scan — Claude Routine

This is the routine a **scheduled Claude session** runs each week to regenerate
the public feed. It uses Claude's built-in web search — **no Anthropic API
tokens, no serverless functions.** The site stays 100% static; this routine just
rewrites one committed file and pushes.

> **How to schedule it:** In Claude Code on the web, create a scheduled /
> recurring session on this repo whose prompt is:
> *"Follow the routine in `maiconflicts/intelligence/SCAN_ROUTINE.md`."*
> Weekly cadence (e.g. Monday morning). Because it runs as a Claude session, it
> bills against your Claude subscription, not metered API tokens. See
> https://code.claude.com/docs/en/claude-code-on-the-web for scheduling.

---

## What to do

1. For **each** of the 14 sources below, use **web search** to find enforcement
   actions, regulatory guidance, settlements, and market-conduct news published
   **in the last 14 days** matching the source's query.
2. Extract the genuinely relevant items (relevance ≥ 0.5).
3. De-duplicate across sources by canonical URL.
4. Group related items into a single story (timeline grouping — see below).
5. Write the result to **`maiconflicts/intelligence/feed.json`** in the schema
   below (overwrite the file completely).
6. Commit and push to `main`. Vercel auto-deploys the new static file.
   - Commit message: `Update regulatory intelligence feed (YYYY-MM-DD)`.
   - If nothing qualified this week, still write a valid file (empty `items`) so
     the page renders cleanly, and note that in the commit message.

## Sources (14)

| id | source name | jurisdiction seed | search focus |
|----|-------------|-------------------|--------------|
| ASIC | ASIC | AU | ASIC enforcement insider trading conflicts of interest market abuse |
| SEC | SEC | US | SEC enforcement action insider trading conflicts of interest |
| FCA | FCA | UK | FCA enforcement insider dealing market abuse conflicts |
| MAS | MAS | SG | MAS Singapore enforcement market misconduct insider trading |
| SFC | SFC | HK | SFC Hong Kong enforcement insider dealing conflicts |
| ESMA | ESMA | EU | ESMA enforcement market abuse conflicts of interest |
| OSC | OSC | CA | Ontario Securities Commission enforcement insider trading |
| FSA | FSA | JP | Japan FSA enforcement market misconduct securities |
| FINMA | FINMA | CH | FINMA Switzerland enforcement market conduct |
| HKMA | HKMA | HK | HKMA Hong Kong Monetary Authority enforcement banking conduct |
| FINRA | FINRA | US | FINRA enforcement broker misconduct market manipulation insider trading |
| AUSTRAC | AUSTRAC | AU | AUSTRAC anti-money laundering financial crime enforcement Australia |
| DOJ | US DOJ | US | US DOJ securities fraud insider trading prosecution settlement |
| NEWS | Regulatory News | (global) | financial services regulator enforcement / conflicts / market abuse news worldwide |

`NEWS` is cross-jurisdictional — classify each item it surfaces into one of the
nine jurisdiction codes below (or drop it if none fit).

## Jurisdiction codes (the feed filters on these — use exactly these nine)

`AU US UK SG HK EU CA JP CH`

## Conduct types (classify each item into one or more)

`INSIDER_TRADING` · `CONFLICTS_OF_INTEREST` · `INFORMATION_BARRIERS` (MNPI / wall
crossing) · `PERSONAL_DEALING` · `MARKET_MANIPULATION` · `DISCLOSURE_FAILURE` ·
`AML_FINANCIAL_CRIME` · `MISCONDUCT_GOVERNANCE` · `OTHER`

## Output schema — `feed.json`

```json
{
  "generated_at": "2026-06-09T06:00:00.000Z",
  "item_count": 0,
  "items": [
    {
      "id": "story_xxxxx",
      "title": "short factual headline",
      "summary": "2-3 sentence ORIGINAL summary in your own words",
      "url": "https://canonical-source-url",
      "source": "ASIC",
      "jurisdiction": "AU",
      "published_at": "2026-06-05",
      "conduct_types": ["INSIDER_TRADING"],
      "relevance_score": 0.9,
      "relevant_excerpt": "optional single quote under 15 words, or null",
      "updates": [
        {
          "title": "earlier related item",
          "summary": "original summary",
          "url": "https://...",
          "source": "SEC",
          "jurisdiction": "AU",
          "published_at": "2026-05-30",
          "conduct_types": ["INSIDER_TRADING"],
          "relevant_excerpt": null
        }
      ]
    }
  ]
}
```

- `id`: any stable short id (e.g. `story_` + a slug/hash of the URL).
- `updates`: items that are follow-ups to the same story (empty array if none).
- Cap the feed at ~60 stories, newest `published_at` first.

## Timeline grouping

Collapse items that clearly cover the **same underlying story** (same
jurisdiction, similar headline, overlapping conduct types) into one entry: the
newest item is the parent; older related items go in its `updates` array,
newest-first. Distinct stories stay separate.

## Copyright discipline (mandatory)

- Store only: title, an **original** 2–3 sentence summary, source name, URL,
  date, conduct types, jurisdiction.
- The summary must be **your own words** — never reproduce article sentences or
  paragraphs.
- At most **one quote per item**, **under 15 words**, only in `relevant_excerpt`
  and only if essential. Otherwise set it to `null`.

## Validate before pushing

- `feed.json` is valid JSON and matches the schema.
- Every `jurisdiction` is one of the nine codes; every `conduct_types` entry is
  one of the nine conduct types.
- Every item has a real `url` found via search.
- `generated_at` is the current UTC timestamp; `item_count` equals `items.length`.
