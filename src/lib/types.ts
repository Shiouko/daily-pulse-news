export interface Article {
  title: string;
  link: string;
  source: string;
  category: 'tech' | 'world';
  publishedAt: string;
  description?: string;
}

export interface NewsResponse {
  tech: Article[];
  world: Article[];
  fetchedAt: string;
}

export const RSS_SOURCES = {
  tech: [
    {
      name: 'Hacker News',
      url: 'https://hnrss.org/frontpage',
    },
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com/feed/',
    },
  ],
  world: [
    {
      name: 'BBC World',
      url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    },
    {
      name: 'Reuters World',
      url: 'https://www.reutersagency.com/feed/?best-topics=world-news&post_type=best',
    },
  ],
} as const;

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'just now';
}

export function sanitize(str: string | undefined | null): string {
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
