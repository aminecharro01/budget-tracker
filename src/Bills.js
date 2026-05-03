import { useState } from 'react';
import styles from './Bills.module.css';
import { useBudget, fmt } from './BudgetContext';
import { t } from './i18n';

export default function Bills() {
  const { bills, saveBill, deleteBill, language } = useBudget();
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
        <h1 className={styles.title}>{t(language, 'recurring_bills')}</h1>
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
    </div>
  );
}
