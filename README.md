# Daily Pulse News

A clean daily news aggregator that pulls the latest tech and world headlines from trusted RSS sources. Built with Next.js and Cloudflare Workers.

**Tagline:** Tech & World. Daily.

## Tech Stack

- **Frontend:** Next.js 14 (App Router, static export)
- **Backend:** Cloudflare Workers
- **Styling:** Custom CSS (no Tailwind, no frameworks)
- **Hosting:** Cloudflare Pages
- **TypeScript**

## RSS Sources

**Tech:**
- Hacker News (hnrss.org/frontpage)
- TechCrunch

**World:**
- BBC World News
- Reuters World News

## How It Works

1. The Cloudflare Worker fetches RSS feeds from multiple sources
2. Articles are merged, deduplicated, and sorted by date
3. Results are cached for 1 hour using Cloudflare Cache API
4. The Next.js frontend fetches from the Worker API and displays articles
5. Users can filter by All, Tech, or World categories

## Project Structure

```
daily-pulse-news/
├── functions/
│   └── api/
│       └── news/
│           └── index.ts       # Cloudflare Worker for RSS fetching
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with fonts
│   │   ├── page.tsx          # Main page
│   │   └── page.module.css   # Page styles
│   ├── components/
│   │   ├── ArticleCard.tsx   # Article card component
│   │   ├── ArticleCard.module.css
│   │   ├── CategoryTabs.tsx  # Category filter tabs
│   │   └── CategoryTabs.module.css
│   └── lib/
│       └── types.ts          # TypeScript types
├── wrangler.toml             # Cloudflare Workers config
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

```bash
# Install dependencies
npm install

# Run locally (Next.js dev server)
npm run dev

# Build for production
npm run build

# Static export to out/
npm run export
```

## Deployment

### Cloudflare Workers

```bash
# Deploy worker
npx wrangler deploy
```

### Cloudflare Pages

```bash
# Create Pages project
npx wrangler pages project create daily-pulse-news

# Deploy static export
npx wrangler pages deploy out/
```

## Design

The design follows a 2010s editorial flat aesthetic:
- Solid colors, no gradients
- Clean box shadows
- Outfit font for headings
- Source Sans 3 for body text
- Tech articles marked red (#e63946)
- World articles marked blue (#2563eb)
- Hover effects with subtle lift and shadow

## License

MIT
# Thu Apr 16 05:37:07 UTC 2026
