# maisoftware-site — Deployment Guide

## URL structure

```
maisoftware.app/               → Mai Software umbrella (lists all your apps)
maisoftware.app/maicasa        → Maicasa landing page   [Marketing URL]
maisoftware.app/maicasa/support → Support page          [Support URL]
maisoftware.app/maicasa/privacy → Privacy policy        [Privacy URL]
```

When you build a second app, add it as:
```
maisoftware.app/yourapp        → New app landing
maisoftware.app/yourapp/support
maisoftware.app/yourapp/privacy
```

## File structure

```
maisoftware-site/
├── index.html                  ← Mai Software home
└── maicasa/
    ├── index.html              ← Maicasa landing
    ├── support/
    │   └── index.html
    └── privacy/
        └── index.html
```

## Step 1 — Register maisoftware.app

1. Go to **cloudflare.com** → Sign in → **Domain Registration**
2. Search `maisoftware.app` and register (~$14 AUD/year)
3. Keep DNS managed by Cloudflare

## Step 2 — GitHub repo

```
git init maisoftware-site
cd maisoftware-site
# copy in the files
git add .
git commit -m "Initial site"
git remote add origin https://github.com/simonvnola/maisoftware-site.git
git push -u origin main
```

## Step 3 — Vercel deploy

1. vercel.com → New Project → Import `simonvnola/maisoftware-site`
2. Framework Preset: **Other**
3. Root Directory: `/`
4. Deploy

## Step 4 — Custom domain in Vercel

1. Project → Settings → Domains → Add `maisoftware.app`
2. Also add `www.maisoftware.app`
3. Vercel gives you DNS records — add them in Cloudflare
4. Set Cloudflare proxy to **DNS only** (grey cloud, not orange)
5. Wait 5–15 mins

## App Store Connect URLs to enter

| Field | URL |
|-------|-----|
| Marketing URL | https://maisoftware.app/maicasa |
| Support URL | https://maisoftware.app/maicasa/support |
| Privacy Policy URL | https://maisoftware.app/maicasa/privacy |

## Before going live — update these

- Replace `info@maisoftware.app` with your actual email address
- Add your real App Store link to the download buttons
- Add a `favicon.ico` (32×32px — use the Maicasa logo dot)

## Adding a second app later

1. Create a new folder: `maisoftware-site/yourapp/`
2. Add `index.html`, `support/index.html`, `privacy/index.html`
3. Add a link to it in the root `index.html` apps list
4. `git push` — Vercel auto-deploys
