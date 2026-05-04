import React, { useEffect, useState, Suspense, lazy } from 'react';
import styles from './App.module.css';
import Auth from './Auth';
import { BudgetProvider, useBudget, fmt } from './BudgetContext';
import AmbientBackground from './AmbientBackground';
import { t } from './i18n';

const Overview = lazy(() => import('./Overview'));
const Settings = lazy(() => import('./Settings'));
const History = lazy(() => import('./History'));

function IconOverview() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );
}

function IconHistory() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function MainApp() {
  const { session, computeMetrics, language } = useBudget();
  const now = new Date();
  const [tab, setTab] = useState('overview');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  if (!session) {
    return <Auth />;
  }

  const { r } = computeMetrics(year, month);
  const rPositive = r >= 0;

  function onMonthChange(dir) {
    let m = month + dir;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>₿</span>
          <span className={styles.brandText}>{t(language, 'budget')}</span>
        </div>

        <div className={`${styles.rCard} ${rPositive ? styles.rPositive : styles.rNegative}`}>
          <div className={styles.rLabel}>{t(language, 'r_star_real')}</div>
          <div className={styles.rValue} style={{ fontFamily: 'var(--mono)' }}>
            {fmt(r)}
          </div>
          <div className={styles.rHint}>{t(language, 'r_star_hint')}</div>
        </div>

        <nav className={styles.nav}>
          <button
            type="button"
            className={tab === 'overview' ? styles.navBtnActive : styles.navBtn}
            onClick={() => setTab('overview')}
          >
            <IconOverview />
            {t(language, 'nav_overview')}
          </button>
          <button type="button" className={tab === 'history' ? styles.navBtnActive : styles.navBtn} onClick={() => setTab('history')}>
            <IconHistory />
            {t(language, 'nav_history')}
          </button>
          <button type="button" className={tab === 'settings' ? styles.navBtnActive : styles.navBtn} onClick={() => setTab('settings')}>
            <IconSettings />
            {t(language, 'nav_settings')}
          </button>
        </nav>
      </aside>

      <main className={styles.main}>
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>}>
          {tab === 'overview' && <Overview key={`${year}-${month}`} year={year} month={month} onMonthChange={onMonthChange} />}
          {tab === 'history' && <History />}
          {tab === 'settings' && <Settings />}
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BudgetProvider>
      <AmbientBackground />
      <MainApp />
    </BudgetProvider>
  );
}
