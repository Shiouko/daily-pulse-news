'use client';

import { useState, useEffect, useCallback } from 'react';
import ArticleCard from '@/components/ArticleCard';
import CategoryTabs from '@/components/CategoryTabs';
import styles from './page.module.css';

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

const NEWS_API_URL = process.env.NEXT_PUBLIC_NEWS_API_URL || '/api/news';

export default function Home() {
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'tech' | 'world'>('all');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(NEWS_API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NewsResponse = await res.json();
      setNews(data);
      setLastUpdated(new Date(data.fetchedAt).toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchNews]);

  const getFilteredArticles = (): Article[] => {
    if (!news) return [];
    if (activeTab === 'all') {
      // Interleave tech and world, sorted by date
      const combined = [...news.tech, ...news.world];
      combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      return combined;
    }
    return news[activeTab];
  };

  const filteredArticles = getFilteredArticles();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brand}>
            <h1 className={styles.title}>DAILY PULSE</h1>
            <p className={styles.tagline}>Tech & World. Daily.</p>
          </div>
          {lastUpdated && (
            <div className={styles.updateInfo}>
              <span className={styles.updateIcon}> refresh </span>
              <span>Updated {lastUpdated}</span>
            </div>
          )}
        </div>
      </header>

      <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <section className={styles.content}>
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading news...</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={fetchNews} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredArticles.length === 0 && (
          <div className={styles.empty}>
            <p>No articles found. Check back soon.</p>
          </div>
        )}

        {!loading && !error && filteredArticles.length > 0 && (
          <div className={styles.grid}>
            {filteredArticles.map((article, index) => (
              <ArticleCard key={`${article.link}-${index}`} article={article} />
            ))}
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <p>Powered by RSS feeds from Hacker News, TechCrunch, BBC, and Reuters.</p>
        <p>Built with Next.js and Cloudflare Workers.</p>
      </footer>
    </main>
  );
}
