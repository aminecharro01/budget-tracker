import { useState } from 'react';
import styles from './Settings.module.css';
import { useBudget, fmt } from './BudgetContext';
import { t } from './i18n';

export default function Settings() {
  const { bills, saveBill, deleteBill, language, setLanguage, theme, setTheme, session, signOut } = useBudget();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [showForm, setShowForm] = useState(false);

  function handleSaveBill() {
    const n = name.trim();
    const amt = parseFloat(String(amount).replace(/,/g, ''));
    if (!n || Number.isNaN(amt) || amt < 0) return;
    saveBill(n, amt);
    setName('');
    setAmount('');
    setShowForm(false);
  }

  const total = bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t(language, 'nav_settings')}</h1>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t(language, 'account_info')}</h2>
        <div className={styles.form}>
          <div className={styles.field}>
            <label>{t(language, 'email')}</label>
            <input type="text" value={session?.user?.email || ''} disabled />
          </div>
          <button type="button" className={styles.save} onClick={signOut} style={{ background: 'var(--red)' }}>
            {t(language, 'sign_out')}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t(language, 'appearance')}</h2>
        <div className={styles.form}>
          <div className={styles.field}>
            <label>{t(language, 'language')}</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>{t(language, 'theme')}</label>
            <select value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="dark">{t(language, 'dark_mode')}</option>
              <option value="light">{t(language, 'light_mode')}</option>
            </select>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.header} style={{ marginBottom: '1rem' }}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>{t(language, 'recurring_bills')}</h2>
          <button type="button" className={styles.cta} onClick={() => setShowForm(!showForm)}>
            {showForm ? t(language, 'close') : t(language, 'add_bill')}
          </button>
        </div>

      {showForm && (
        <div className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="bname">{t(language, 'bill_name')}</label>
            <input id="bname" value={name} onChange={(e) => setName(e.target.value)} placeholder="..." />
          </div>
          <div className={styles.field}>
            <label htmlFor="bamt">{t(language, 'tx_amount')}</label>
            <input id="bamt" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
          <button type="button" className={styles.save} onClick={handleSaveBill}>
            {t(language, 'save_bill')}
          </button>
        </div>
      )}

      <ul className={styles.list}>
        {bills.map((b) => (
          <li key={b.id} className={styles.item}>
            <div className={styles.itemMain}>
              <span className={styles.itemName}>{b.name}</span>
            </div>
            <span className={styles.itemAmt} style={{ fontFamily: 'var(--mono)' }}>
              {fmt(b.amount)}
            </span>
            <button type="button" className={styles.del} onClick={() => deleteBill(b.id)} aria-label={`Delete ${b.name}`}>
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.summary}>
        <div className={styles.sumRow}>
          <span>{t(language, 'total_all_bills')}</span>
          <strong style={{ fontFamily: 'var(--mono)' }}>{fmt(total)}</strong>
        </div>
      </div>
      </section>
    </div>
  );
}
