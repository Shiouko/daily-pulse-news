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

const RSS_SOURCES = {
  tech: [
    { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  ],
  world: [
    { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?best-topics=world-news&post_type=best' },
  ],
};

const CACHE_TTL = 60 * 60; // 1 hour in seconds
const CACHE_KEY = 'news:all';

function sanitize(str: string | undefined | null): string {
  if (!str) return '';
  return str
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
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(item);
    const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(item);
    const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(item);
    const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(item);

    const title = sanitize(titleMatch?.[1]);
    const link = sanitize(linkMatch?.[1] || getLinkFromGuid(item));
    const publishedAt = pubDateMatch ? new Date(sanitize(pubDateMatch[1])).toISOString() : new Date().toISOString();
    const description = sanitize(descMatch?.[1]);

    if (title && link) {
      articles.push({
        title,
        link,
        source: sourceName,
        category,
        publishedAt,
        description: description?.substring(0, 200),
      });
    }
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

function dedupeArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    const key = article.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchAllNews(): Promise<NewsResponse> {
  const techArticles: Article[] = [];
  const worldArticles: Article[] = [];

  // Fetch tech sources
  await Promise.all(
    RSS_SOURCES.tech.map(async (source) => {
      try {
        const xml = await fetchWithTimeout(source.url);
        const articles = parseRSS(xml, source.name, 'tech');
        techArticles.push(...articles);
      } catch (err) {
        console.error(`Failed to fetch ${source.name}:`, err);
      }
    })
  );

  // Fetch world sources
  await Promise.all(
    RSS_SOURCES.world.map(async (source) => {
      try {
        const xml = await fetchWithTimeout(source.url);
        const articles = parseRSS(xml, source.name, 'world');
        worldArticles.push(...articles);
      } catch (err) {
        console.error(`Failed to fetch ${source.name}:`, err);
      }
    })
  );

  // Sort by date, newest first
  techArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  worldArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Dedup
  const dedupedTech = dedupeArticles(techArticles);
  const dedupedWorld = dedupeArticles(worldArticles);

  return {
    tech: dedupedTech.slice(0, 30),
    world: dedupedWorld.slice(0, 30),
    fetchedAt: new Date().toISOString(),
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      // Try cache first
      const cache = caches.default;
      let cached = await cache.match(CACHE_KEY);

      if (cached) {
        const cachedData = await cached.json() as NewsResponse;
        const cacheAge = Date.now() - new Date(cachedData.fetchedAt).getTime();
        
        // If cache is fresh (less than TTL), return it
        if (cacheAge < CACHE_TTL * 1000) {
          return new Response(JSON.stringify(cachedData), {
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

      // Store in cache
      const cacheResponse = new Response(JSON.stringify(news), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          'X-Cache': 'MISS',
        },
      });
      await cache.put(CACHE_KEY, cacheResponse.clone());

      return new Response(JSON.stringify(news), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          ...corsHeaders,
        },
      });
    } catch (err) {
      console.error('Worker error:', err);
      
      // Try to return stale cache on error
      try {
        const cache = caches.default;
        const stale = await cache.match(CACHE_KEY);
        if (stale) {
          const staleData = await stale.json();
          return new Response(JSON.stringify(staleData), {
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'STALE',
              'X-Error': String(err),
              ...corsHeaders,
            },
          });
        }
      } catch {
        // Cache miss on error recovery
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
