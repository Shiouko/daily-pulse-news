interface Article {
  title: string;
  link: string;
  source: string;
  category: 'tech' | 'world';
  publishedAt: string;
  description?: string;
}

interface NewsResponse {
  tech: Article[];
  world: Article[];
  fetchedAt: string;
}

interface CacheEntry {
  data: NewsResponse;
  timestamp: number;
}

const RSS_SOURCES = {
  tech: [
    { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  ],
  world: [
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'ABC News', url: 'https://abcnews.go.com/abcnews/topstories' },
    { name: 'NYTimes', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
  ],
};

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// In-memory cache
const cache = new Map<string, CacheEntry>();

function sanitize(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '') // strip CDATA blocks first
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseRSS(xml: string, sourceName: string, category: 'tech' | 'world'): Article[] {
  const articles: Article[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    // Title
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(item);
    const title = sanitize(titleMatch?.[1]);
    if (!title) continue;

    // Link - RSS 2.0 uses <link> plain or <link><![CDATA[...]]></link>
    let link = '';
    const cdataLink = /<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i.exec(item);
    if (cdataLink) {
      link = sanitize(cdataLink[1]);
    } else {
      const plainLink = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(item);
      link = sanitize(plainLink?.[1]) || getLinkFromGuid(item);
    }
    if (!link) continue;

    // PubDate
    const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(item);
    let publishedAt: string;
    try {
      publishedAt = pubDateMatch ? new Date(sanitize(pubDateMatch[1])).toISOString() : new Date().toISOString();
    } catch {
      publishedAt = new Date().toISOString();
    }

    // Description
    const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(item);
    const description = sanitize(descMatch?.[1])?.substring(0, 200);

    articles.push({
      title,
      link,
      source: sourceName,
      category,
      publishedAt,
      description,
    });
  }

  return articles;
}

function getLinkFromGuid(item: string): string {
  const guidMatch = /<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(item);
  return sanitize(guidMatch?.[1]) || '';
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Daily-Pulse-News/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

function dedupeArticles(articles: Article[], maxCount: number): Article[] {
  const seen = new Set<string>();
  const result: Article[] = [];
  for (const article of articles) {
    const key = article.title.toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(article);
      if (result.length >= maxCount) break;
    }
  }
  return result;
}

async function fetchAllNews(): Promise<NewsResponse> {
  const techArticles: Article[] = [];
  const worldArticles: Article[] = [];

  // Fetch tech sources
  const techResults = await Promise.allSettled(
    RSS_SOURCES.tech.map(async (source) => {
      const xml = await fetchWithTimeout(source.url);
      return parseRSS(xml, source.name, 'tech');
    })
  );
  for (const result of techResults) {
    if (result.status === 'fulfilled') {
      techArticles.push(...result.value);
    } else {
      console.error('Tech fetch failed:', result.reason);
    }
  }

  // Fetch world sources
  const worldResults = await Promise.allSettled(
    RSS_SOURCES.world.map(async (source) => {
      const xml = await fetchWithTimeout(source.url);
      return parseRSS(xml, source.name, 'world');
    })
  );
  for (const result of worldResults) {
    if (result.status === 'fulfilled') {
      worldArticles.push(...result.value);
    } else {
      console.error('World fetch failed:', result.reason);
    }
  }

  // Sort by date, newest first (filter out invalid dates first)
  const validTech = techArticles.filter(a => !isNaN(new Date(a.publishedAt).getTime()));
  const validWorld = worldArticles.filter(a => !isNaN(new Date(a.publishedAt).getTime()));

  validTech.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  validWorld.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return {
    tech: dedupeArticles(validTech, 30),
    world: dedupeArticles(validWorld, 30),
    fetchedAt: new Date().toISOString(),
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CACHE_KEY = 'news:v2';

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      // Check in-memory cache first
      const cached = cache.get(CACHE_KEY);

      if (cached) {
        const cacheAge = Date.now() - cached.timestamp;
        if (cacheAge < CACHE_TTL) {
          return new Response(JSON.stringify(cached.data), {
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'HIT',
              ...corsHeaders,
            },
          });
        }
      }

      // Fetch fresh data
      const news = await fetchAllNews();

      // Store in memory cache
      cache.set(CACHE_KEY, {
        data: news,
        timestamp: Date.now(),
      });

      return new Response(JSON.stringify(news), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          'Cache-Control': 'public, max-age=3600',
          ...corsHeaders,
        },
      });
    } catch (err) {
      console.error('Worker error:', err);

      const stale = cache.get(CACHE_KEY);
      if (stale) {
        return new Response(JSON.stringify(stale.data), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'STALE',
            ...corsHeaders,
          },
        });
      }

      return new Response(JSON.stringify({ error: 'Failed to fetch news' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
};
