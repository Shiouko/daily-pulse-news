import styles from './CategoryTabs.module.css';

interface CategoryTabsProps {
  activeTab: 'all' | 'tech' | 'world' | 'ai' | 'malaysia';
  onTabChange: (tab: 'all' | 'tech' | 'world' | 'ai' | 'malaysia') => void;
}

export default function CategoryTabs({ activeTab, onTabChange }: CategoryTabsProps) {
  return (
    <nav className={styles.tabs}>
      <button
        className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
        onClick={() => onTabChange('all')}
      >
        All
      </button>
      <button
        className={`${styles.tab} ${styles.tech} ${activeTab === 'tech' ? styles.active : ''}`}
        onClick={() => onTabChange('tech')}
      >
        Tech
      </button>
      <button
        className={`${styles.tab} ${styles.world} ${activeTab === 'world' ? styles.active : ''}`}
        onClick={() => onTabChange('world')}
      >
        World
      </button>
      <button
        className={`${styles.tab} ${styles.ai} ${activeTab === 'ai' ? styles.active : ''}`}
        onClick={() => onTabChange('ai')}
      >
        AI
      </button>
      <button
        className={`${styles.tab} ${styles.malaysia} ${activeTab === 'malaysia' ? styles.active : ''}`}
        onClick={() => onTabChange('malaysia')}
      >
        Malaysia
      </button>
    </nav>
  );
}
