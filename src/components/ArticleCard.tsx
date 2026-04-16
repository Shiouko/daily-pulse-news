import styles from './ArticleCard.module.css';

interface Article {
  title: string;
  link: string;
  source: string;
  category: 'tech' | 'world' | 'ai' | 'malaysia';
  publishedAt: string;
  description?: string;
}

interface ArticleCardProps {
  article: Article;
}

function timeAgo(dateStr: string): string {
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

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    tech: 'Tech',
    world: 'World',
    ai: 'AI',
    malaysia: 'Malaysia',
  };
  return labels[category] || category;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className={`${styles.card} ${styles[article.category]}`}>
      <div className={styles.header}>
        <span className={styles.source}>{article.source}</span>
        <span className={`${styles.category} ${styles[article.category]}`}>
          {categoryLabel(article.category)}
        </span>
      </div>
      <h2 className={styles.title}>
        <a href={article.link} target="_blank" rel="noopener noreferrer">
          {article.title}
        </a>
      </h2>
      {article.description && (
        <p className={styles.description}>{article.description}</p>
      )}
      <div className={styles.footer}>
        <span className={styles.time}>{timeAgo(article.publishedAt)}</span>
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.readMore}
        >
          Read more
        </a>
      </div>
    </article>
  );
}
