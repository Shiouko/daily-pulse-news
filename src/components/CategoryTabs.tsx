import styles from './CategoryTabs.module.css';

interface CategoryTabsProps {
  activeTab: 'all' | 'tech' | 'world';
  onTabChange: (tab: 'all' | 'tech' | 'world') => void;
}

export default function CategoryTabs({ activeTab, onTabChange }: CategoryTabsProps) {
  return (
    <nav className={styles.tabs}>
      <div className={styles.tabList}>
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
      </div>
    </nav>
  );
}
