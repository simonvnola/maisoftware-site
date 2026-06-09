// /api/run-scan.js
//
// Weekly cron-only scan. Ports the maiconflicts Electron intelligenceScanner.ts
// logic into a self-contained Vercel serverless function:
//   - 14 regulatory / news sources
//   - parallel web-search-backed fetch via the Anthropic API
//   - AI extraction + conduct-type classification + relevance scoring
//   - URL de-duplication
//   - timeline grouping (related items collapse under a parent story)
//   - writes the cached feed to Vercel Blob as intelligence-feed.json
//
// NOTE: The original intelligenceScanner.ts lives in a separate repo
// (/Users/simonnola/maiconflicts2) that is not available in this environment,
// so the source list and grouping logic below are a faithful reimplementation
// of the behaviour described in the build spec rather than a line-by-line port.

import { put, list } from '@vercel/blob';

// Vercel: allow the scan plenty of time (web search across 14 sources in
// parallel). 300s is the Pro-plan ceiling; on Hobby this is capped at 60s.
export const maxDuration = 300;

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const FEED_BLOB = 'intelligence-feed.json';
const MAX_ITEMS = 60;
const LOOKBACK_DAYS = 14;

// The nine jurisdictions the public feed filters on.
const JURISDICTIONS = ['AU', 'US', 'UK', 'SG', 'HK', 'EU', 'CA', 'JP', 'CH'];

const CONDUCT_TYPES = [
  'INSIDER_TRADING',       // Insider trading / market abuse
  'CONFLICTS_OF_INTEREST',
  'INFORMATION_BARRIERS',  // MNPI / wall crossing
  'PERSONAL_DEALING',      // Personal account dealing
  'MARKET_MANIPULATION',
  'DISCLOSURE_FAILURE',
  'AML_FINANCIAL_CRIME',
  'MISCONDUCT_GOVERNANCE',
  'OTHER',
];

const SOURCES = [
  { id: 'ASIC',    name: 'ASIC',    jurisdiction: 'AU', flag: '🇦🇺',
    query: 'ASIC enforcement insider trading conflicts of interest market abuse' },
  { id: 'SEC',     name: 'SEC',     jurisdiction: 'US', flag: '🇺🇸',
    query: 'SEC enforcement action insider trading conflicts of interest' },
  { id: 'FCA',     name: 'FCA',     jurisdiction: 'UK', flag: '🇬🇧',
    query: 'FCA enforcement insider dealing market abuse conflicts' },
  { id: 'MAS',     name: 'MAS',     jurisdiction: 'SG', flag: '🇸🇬',
    query: 'MAS Singapore enforcement market misconduct insider trading' },
  { id: 'SFC',     name: 'SFC',     jurisdiction: 'HK', flag: '🇭🇰',
    query: 'SFC Hong Kong enforcement insider dealing conflicts' },
  { id: 'ESMA',    name: 'ESMA',    jurisdiction: 'EU', flag: '🇪🇺',
    query: 'ESMA enforcement market abuse conflicts of interest' },
  { id: 'OSC',     name: 'OSC',     jurisdiction: 'CA', flag: '🇨🇦',
    query: 'Ontario Securities Commission enforcement insider trading' },
  { id: 'FSA',     name: 'FSA',     jurisdiction: 'JP', flag: '🇯🇵',
    query: 'Japan FSA enforcement market misconduct securities' },
  { id: 'FINMA',   name: 'FINMA',   jurisdiction: 'CH', flag: '🇨🇭',
    query: 'FINMA Switzerland enforcement market conduct' },
  { id: 'HKMA',    name: 'HKMA',    jurisdiction: 'HK', flag: '🇭🇰',
    query: 'HKMA Hong Kong Monetary Authority enforcement banking conduct misconduct' },
  { id: 'FINRA',   name: 'FINRA',   jurisdiction: 'US', flag: '🇺🇸',
    query: 'FINRA enforcement broker misconduct market manipulation insider trading' },
  { id: 'AUSTRAC', name: 'AUSTRAC', jurisdiction: 'AU', flag: '🇦🇺',
    query: 'AUSTRAC anti-money laundering financial crime enforcement Australia' },
  { id: 'DOJ',     name: 'US DOJ',  jurisdiction: 'US', flag: '🇺🇸',
    query: 'US DOJ securities fraud insider trading prosecution settlement financial services' },
  { id: 'NEWS',    name: 'Regulatory News', jurisdiction: 'GLOBAL', flag: '🌐',
    query: 'financial services regulator enforcement insider trading conflicts of interest market abuse news worldwide' },
];

// ---------------------------------------------------------------------------
// Authorisation
// ---------------------------------------------------------------------------

function isAuthorisedCron(req) {
  const secret = process.env.CRON_SECRET;
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET
  // is set. We also accept the same header for manual triggers / testing.
  const auth = req.headers['authorization'];
  if (secret && auth === `Bearer ${secret}`) return true;
  // Fallback: Vercel marks cron invocations with this header.
  if (req.headers['x-vercel-cron']) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Anthropic web-search extraction
// ---------------------------------------------------------------------------

function buildPrompt(source, today) {
  return `Today is ${today}. You are a regulatory intelligence analyst building a public enforcement feed.

Search the web for enforcement actions, regulatory guidance, settlements, and market-conduct news related to: ${source.query}.

Prioritise items PUBLISHED IN THE LAST ${LOOKBACK_DAYS} DAYS. Topics of interest: insider trading, conflicts of interest, information barriers / MNPI, personal account dealing, market manipulation, disclosure failures, AML / financial crime, and governance / misconduct in financial services.

After searching, respond with ONLY a JSON array (no prose, no markdown code fences) of the most relevant items. Each element must be exactly:
{
  "title": "short factual headline",
  "summary": "2-3 sentence ORIGINAL summary in your own words",
  "url": "canonical source URL you found via search",
  "source": "${source.name}",
  "jurisdiction": one of ${JSON.stringify(JURISDICTIONS)},
  "published_at": "YYYY-MM-DD",
  "conduct_types": a non-empty subset of ${JSON.stringify(CONDUCT_TYPES)},
  "relevance_score": number between 0 and 1,
  "relevant_excerpt": "OPTIONAL single quote UNDER 15 words, only if essential"
}

Strict rules:
- Only include items genuinely about the topics above, with relevance_score >= 0.5.
- Only include items you can attribute to a real URL returned by your search.
- The "summary" MUST be entirely your own words. Never reproduce sentences or paragraphs from the article. At most ONE short quote per item, under 15 words, and only in "relevant_excerpt".
- Choose the single best jurisdiction code. If none of the nine fit the item, omit the item.
- Return at most 8 items, newest first. If nothing qualifies, return [].`;
}

async function callAnthropic(messages) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      messages,
      // web_search_20250305 is GA — no anthropic-beta header required.
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 500)}`);
  }
  return res.json();
}

async function searchSource(source, today) {
  const prompt = buildPrompt(source, today);
  const messages = [{ role: 'user', content: prompt }];
  let response;

  // Server-side web search runs an internal loop; if it pauses (pause_turn)
  // we append the assistant turn and re-send to let it resume.
  for (let i = 0; i < 8; i++) {
    response = await callAnthropic(messages);
    if (response.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: response.content });
      continue;
    }
    break;
  }

  const text = (response?.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  return parseItems(text, source);
}

function parseItems(text, source) {
  if (!text) return [];
  // Extract the JSON array even if the model wrapped it in fences or prose.
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return [];
  let raw;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const out = [];
  for (const it of raw) {
    if (!it || typeof it !== 'object') continue;
    const url = typeof it.url === 'string' ? it.url.trim() : '';
    const title = typeof it.title === 'string' ? it.title.trim() : '';
    if (!url || !title || !/^https?:\/\//i.test(url)) continue;

    const jurisdiction = JURISDICTIONS.includes(it.jurisdiction) ? it.jurisdiction : null;
    if (!jurisdiction) continue;

    const conduct = Array.isArray(it.conduct_types)
      ? it.conduct_types.filter((c) => CONDUCT_TYPES.includes(c))
      : [];

    const score = Number(it.relevance_score);
    if (!Number.isFinite(score) || score < 0.5) continue;

    out.push({
      title,
      summary: typeof it.summary === 'string' ? it.summary.trim() : '',
      url,
      source: source.name,
      jurisdiction,
      published_at: normaliseDate(it.published_at),
      conduct_types: conduct.length ? conduct : ['OTHER'],
      relevance_score: Math.min(1, Math.max(0, score)),
      relevant_excerpt:
        typeof it.relevant_excerpt === 'string' && it.relevant_excerpt.trim()
          ? capWords(it.relevant_excerpt.trim(), 15)
          : null,
    });
  }
  return out;
}

function normaliseDate(d) {
  if (typeof d === 'string') {
    const m = d.match(/\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
    const parsed = Date.parse(d);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function capWords(s, n) {
  const words = s.replace(/^["'“”]+|["'“”]+$/g, '').split(/\s+/);
  return words.slice(0, n).join(' ');
}

// ---------------------------------------------------------------------------
// De-duplication + timeline grouping
// ---------------------------------------------------------------------------

function normaliseUrl(url) {
  try {
    const u = new URL(url);
    let host = u.host.toLowerCase().replace(/^www\./, '');
    let path = u.pathname.replace(/\/+$/, '');
    return `${host}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function dedupe(items) {
  const seen = new Map();
  for (const it of items) {
    const key = normaliseUrl(it.url);
    const existing = seen.get(key);
    // Keep the higher-relevance copy when the same URL turns up twice.
    if (!existing || it.relevance_score > existing.relevance_score) {
      seen.set(key, it);
    }
  }
  return [...seen.values()];
}

function titleTokens(t) {
  return new Set(
    (t || '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function shareConduct(a, b) {
  return a.conduct_types.some((c) => b.conduct_types.includes(c));
}

function storyId(url) {
  // Small stable id from the normalised URL.
  let h = 0;
  const s = normaliseUrl(url);
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return 'story_' + Math.abs(h).toString(36);
}

// Port of the Electron scanner's detectUpdates step: collapse related items
// (same jurisdiction, similar headline, overlapping conduct types) into a
// single story whose newest item is the parent and older items are updates.
function groupTimeline(items) {
  const sorted = [...items].sort(
    (a, b) => (b.published_at < a.published_at ? -1 : b.published_at > a.published_at ? 1 : 0)
  );

  const parents = [];
  for (const it of sorted) {
    const tokens = titleTokens(it.title);
    let attached = false;
    for (const p of parents) {
      if (
        p.jurisdiction === it.jurisdiction &&
        shareConduct(p, it) &&
        jaccard(p._tokens, tokens) >= 0.55 &&
        normaliseUrl(p.url) !== normaliseUrl(it.url)
      ) {
        p.updates.push(stripInternal(it));
        attached = true;
        break;
      }
    }
    if (!attached) {
      parents.push({ ...it, id: storyId(it.url), updates: [], _tokens: tokens });
    }
  }

  return parents.slice(0, MAX_ITEMS).map((p) => {
    const { _tokens, ...clean } = p;
    return clean;
  });
}

function stripInternal(it) {
  const { _tokens, updates, id, ...clean } = it;
  return clean;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  if (!isAuthorisedCron(req)) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const today = new Date().toISOString().slice(0, 10);

  const results = await Promise.allSettled(
    SOURCES.map((s) => searchSource(s, today))
  );

  let collected = [];
  const errors = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      collected = collected.concat(r.value);
    } else {
      errors.push({ source: SOURCES[i].id, error: String(r.reason).slice(0, 200) });
    }
  });

  const deduped = dedupe(collected);
  const items = groupTimeline(deduped);

  const feed = {
    generated_at: new Date().toISOString(),
    item_count: items.length,
    items,
  };

  try {
    await put(FEED_BLOB, JSON.stringify(feed), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (e) {
    return res.status(500).json({ error: 'blob_write_failed', detail: String(e).slice(0, 300) });
  }

  return res.status(200).json({
    success: true,
    item_count: items.length,
    sources_ok: results.filter((r) => r.status === 'fulfilled').length,
    sources_failed: errors,
  });
}
