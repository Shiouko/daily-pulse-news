# SPEC.md — Daily Pulse News Blog

## 1. Concept & Vision

A clean, no-nonsense daily news aggregator that pulls the latest tech and world headlines. Feels like a well-curated newspaper from the mid-2010s — functional, readable, trustworthy. Not another AI-slop dashboard with gradients and glassmorphism. Just solid information architecture with personality.

**Name:** Daily Pulse
**Tagline:** "Tech & World. Daily."

---

## 2. System Design

### Architecture
- **Frontend:** Next.js (App Router) — static export for Cloudflare Pages
- **Backend/Proxy:** Cloudflare Worker — fetches RSS feeds, hides API keys
- **Hosting:** Cloudflare Pages (public)
- **Repository:** GitHub public repo under Shiouko

### Components
1. **News Worker** (`/functions/api/news/`) — Cloudflare Worker that:
   - Fetches from multiple RSS sources
   - Merges and dedupes articles
   - Returns JSON response
   - Caches for 1 hour

2. **Frontend** (Next.js static):
   - Homepage: Latest news grid (tech + world)
   - Category tabs: All / Tech / World
   - Article cards with source, title, time ago, external link
   - Auto-refresh indicator

### RSS Sources
- **Tech:** Hacker News RSS, TechCrunch RSS
- **World:** BBC World RSS, Reuters World RSS

### Tech Stack
- Next.js 14 (App Router, static export)
- TypeScript
- Tailwind CSS (NO — custom CSS per design rules)
- Lucide icons
- Cloudflare Pages + Workers

---

## 3. Data Architecture

### Article Schema
```typescript
interface Article {
  title: string;
  link: string;
  source: string;      // "Hacker News", "TechCrunch", "BBC", "Reuters"
  category: "tech" | "world";
  publishedAt: string; // ISO 8601
  description?: string;
}
```

### News Worker Response
```typescript
interface NewsResponse {
  tech: Article[];
  world: Article[];
  fetchedAt: string;
}
```

### Caching Strategy
- Cloudflare Worker caches response for 1 hour (Cache-API)
- Stale-while-revalidate pattern

---

## 4. Security Concerns

- **API keys:** NONE exposed. Worker fetches RSS only, no paid API needed.
- **CORS:** Worker allows requests from Pages domain only
- **Sanitization:** Article titles/descriptions sanitized before render
- **No user input:** Static site, no user-generated content attack surface

---

## 5. Visual Design

### Aesthetic Direction
**2010s Editorial Flat** — Think ReadWrite, TechCrunch circa 2015. Clean, functional, trustworthy. NOT glassmorphism, NOT gradients, NOT neon. Solid colors, box shadows, sharp typography.

### Color Palette
```css
--bg-primary: #ffffff;
--bg-secondary: #f5f5f5;
--bg-card: #ffffff;
--text-primary: #1a1a1a;
--text-secondary: #666666;
--text-muted: #999999;
--accent-tech: #e63946;     /* Red — tech category */
--accent-world: #2563eb;   /* Blue — world category */
--border: #e0e0e0;
--shadow: 0 1px 3px rgba(0,0,0,0.08);
```

### Typography
- **Display:** "Space Grotesk" — but wait, frontend-design-3 says avoid Space Grotesk as it's overused by AI
- **Alternative:** "Outfit" or "DM Sans" — distinctive, not Inter
- **Body:** "Source Sans 3" — readable, editorial
- **Monospace:** For timestamps — "JetBrains Mono"

### Layout
```
┌─────────────────────────────────────────────┐
│  DAILY PULSE              [Tech] [World]    │
│  Tech & World. Daily.      🔄 Updated Xm ago│
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐         │
│  │  SOURCE      │  │  SOURCE      │         │
│  │  Title       │  │  Title       │         │
│  │  2h ago  →   │  │  3h ago  →   │         │
│  └──────────────┘  └──────────────┘         │
│                                             │
│  ┌──────────────┐  ┌──────────────┐         │
│  │  SOURCE      │  │  SOURCE      │         │
│  │  Title       │  │  Title       │         │
│  │  5h ago  →   │  │  6h ago  →   │         │
│  └──────────────┘  └──────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
│  Powered by RSS · Built with Next.js        │
└─────────────────────────────────────────────┘
```

### Component States
- **Cards:** Default → Hover (lift + border highlight, 200ms)
- **Tabs:** Inactive → Active (color shift + underline)
- **Links:** Default → Hover (color change, 150ms)

---

## 6. Implementation Plan

### Phase 1: Project Setup
1. Create Next.js project with TypeScript
2. Configure static export for Cloudflare Pages
3. Set up wrangler for worker development
4. Configure tailwind-free custom CSS

### Phase 2: Worker Development
1. Build RSS fetcher with merge/dedup logic
2. Implement caching with Cache API
3. Test worker locally with `wrangler dev`
4. Deploy worker to Cloudflare

### Phase 3: Frontend Development
1. Build article card component
2. Implement category tabs
3. Add auto-refresh with "Xm ago" display
4. Style with custom CSS (no Tailwind)

### Phase 4: Deployment
1. Push to GitHub (Shiouko/daily-pulse-news)
2. Connect repo to Cloudflare Pages
3. Configure build command and output directory
4. Add custom domain (optional)

---

## 7. Acceptance Criteria

- [ ] News loads from at least 2 tech + 2 world RSS sources
- [ ] No API keys in frontend code
- [ ] Cards show source, title, time ago, link
- [ ] Tech articles marked red, World articles marked blue
- [ ] Tabs filter by category correctly
- [ ] Auto-refresh updates "Xm ago" timestamps
- [ ] No gradients, glassmorphism, or AI-slop aesthetics
- [ ] Hover states work on all interactive elements
- [ ] Mobile responsive (1-col on mobile, 2-col on tablet+)
- [ ] GitHub repo is public
- [ ] Deployed on Cloudflare Pages
- [ ] Link shared
