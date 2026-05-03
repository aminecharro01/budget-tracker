import React, { useEffect, useState, Suspense, lazy } from 'react';
import styles from './App.module.css';
import Auth from './Auth';
import { BudgetProvider, useBudget, fmt } from './BudgetContext';
import AmbientBackground from './AmbientBackground';

const Overview = lazy(() => import('./Overview'));
const Bills = lazy(() => import('./Bills'));
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

function IconBills() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
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
  const { session, computeMetrics, signOut } = useBudget();
  const now = new Date();
  const [tab, setTab] = useState('overview');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [theme, setTheme] = useState(() => localStorage.getItem('budget_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('budget_theme', theme);
  }, [theme]);

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

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>₿</span>
          <span className={styles.brandText}>Budget</span>
        </div>

        <div className={`${styles.rCard} ${rPositive ? styles.rPositive : styles.rNegative}`}>
          <div className={styles.rLabel}>R* (Real)</div>
          <div className={styles.rValue} style={{ fontFamily: 'var(--mono)' }}>
            {fmt(r)}
          </div>
          <div className={styles.rHint}>After Malak & K bills</div>
        </div>

        <nav className={styles.nav}>
          <button
            type="button"
            className={tab === 'overview' ? styles.navBtnActive : styles.navBtn}
            onClick={() => setTab('overview')}
          >
            <IconOverview />
            Overview
          </button>
          <button type="button" className={tab === 'bills' ? styles.navBtnActive : styles.navBtn} onClick={() => setTab('bills')}>
            <IconBills />
            Bills
          </button>
          <button type="button" className={tab === 'history' ? styles.navBtnActive : styles.navBtn} onClick={() => setTab('history')}>
            <IconHistory />
            History
          </button>
        </nav>

        <p className={styles.footer}>
          Data synced to Cloud. <br/>
          <button 
            onClick={toggleTheme} 
            style={{background:'transparent', border:'none', color:'var(--text)', cursor:'pointer', marginTop:'0.5rem', padding:0, fontSize:'0.8rem', fontWeight:600}}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <br/>
          <button 
            onClick={signOut} 
            style={{background:'transparent', border:'none', color:'var(--red)', cursor:'pointer', marginTop:'0.5rem', padding:0, fontSize:'0.8rem', fontWeight:600}}
          >
            Sign Out
          </button>
        </p>
      </aside>

      <main className={styles.main}>
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>}>
          {tab === 'overview' && <Overview key={`${year}-${month}`} year={year} month={month} onMonthChange={onMonthChange} />}
          {tab === 'bills' && <Bills />}
          {tab === 'history' && <History />}
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
