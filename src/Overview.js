import { useState } from 'react';
import styles from './Overview.module.css';
import { useBudget, fmt } from './BudgetContext';
import { t } from './i18n';

function MetricCard({ label, value, subtitle, positive, negative, highlight }) {
  const color = negative ? 'var(--red)' : positive ? 'var(--green)' : 'var(--blue)';
  return (
    <div className={`${styles.metric} ${highlight ? styles.metricHighlight : ''}`}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue} style={{ color, fontFamily: 'var(--mono)' }}>
        {value}
      </div>
      {subtitle && <div className={styles.metricSub}>{subtitle}</div>}
    </div>
  );
}

function Row({ label, value, positive, negative, bold, badge, color, checked, onCheck }) {
  let valStyle = {};
  if (color) valStyle.color = color;
  else if (negative) valStyle.color = 'var(--red)';
  else if (positive) valStyle.color = 'var(--green)';

  return (
    <div className={styles.row}>
      <div className={styles.rowLeft}>
        {onCheck !== undefined && (
          <input
            type="checkbox"
            checked={checked}
            onChange={onCheck}
            className={styles.billCheck}
          />
        )}
        <span className={bold ? styles.rowLabelBold : styles.rowLabel}>{label}</span>
        {badge && <span className={styles.badgeK}>{badge}</span>}
      </div>
      <span className={styles.rowVal} style={{ ...valStyle, fontFamily: 'var(--mono)' }}>
        {value}
      </span>
    </div>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Overview({ year, month, onMonthChange }) {
  const { bills, computeMetrics, saveInitial, toggleBill, addTransaction, deleteTx, getPreviousMalakRemaining, language } = useBudget();
  const metrics = computeMetrics(year, month);
  const { acc, malakRemaining, wih, k, r, paidBills, transactions, initialAcc, initialMalak, hasRecord } = metrics;

  const defaultMalak = getPreviousMalakRemaining(year, month);
  const displayInitialAcc = hasRecord ? String(initialAcc) : '';
  const displayInitialMalak = hasRecord ? String(initialMalak) : String(defaultMalak);

  const [showForm, setShowForm] = useState(false);
  const [accInput, setAccInput] = useState(displayInitialAcc);
  const [malakInput, setMalakInput] = useState(displayInitialMalak);

  const [showTxForm, setShowTxForm] = useState(false);
  const [txType, setTxType] = useState('EXPENSE');
  const [txAmt, setTxAmt] = useState('');
  const [txDesc, setTxDesc] = useState('');

  function handleSaveInitial() {
    const a = parseFloat(accInput.replace(/,/g, '')) || 0;
    const m = parseFloat(malakInput.replace(/,/g, '')) || 0;
    saveInitial(year, month, a, m);
    setShowForm(false);
  }

  function handleAddTransaction() {
    const amount = parseFloat(txAmt.replace(/,/g, ''));
    if (!amount || amount <= 0) return;
    
    addTransaction(year, month, txType, amount, txDesc);
    setTxAmt('');
    setTxDesc('');
    setShowTxForm(false);
  }

  const label = `${MONTHS[month]} ${year}`;

  const today = new Date();
  let daysLeft = 0;
  if (today.getFullYear() === year && today.getMonth() === month) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    daysLeft = lastDay - today.getDate() + 1;
  } else if (today.getFullYear() < year || (today.getFullYear() === year && today.getMonth() < month)) {
    daysLeft = new Date(year, month + 1, 0).getDate();
  }
  
  let dailyBudget = '--';
  if (daysLeft > 0 && r > 0) {
    dailyBudget = fmt(r / daysLeft);
  }

  const isLowBalance = r <= k && r > 0;
  const isZeroBalance = r <= 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.navRow}>
        <div className={styles.monthNav}>
          <button type="button" className={styles.iconBtn} onClick={() => onMonthChange(-1)} aria-label="Previous month">
            ←
          </button>
          <span className={styles.monthLabel} style={{ fontFamily: 'var(--mono)' }}>
            {label}
          </span>
          <button type="button" className={styles.iconBtn} onClick={() => onMonthChange(1)} aria-label="Next month">
            →
          </button>
        </div>
        <button type="button" className={styles.cta} onClick={() => setShowForm(!showForm)}>
          {showForm ? t(language, 'close') : t(language, 'set_initial')}
        </button>
      </div>

      {(isLowBalance || isZeroBalance) && (
        <div className={`${styles.warningBanner} ${isZeroBalance ? styles.warningCritical : ''}`}>
          ⚠️ {isZeroBalance ? t(language, 'warn_critical') : t(language, 'warn_low', { k: fmt(k) })}
        </div>
      )}

      {!hasRecord || showForm ? (
        <div className={styles.formPanel}>
          <p className={styles.formTitle}>{t(language, 'set_initial')}</p>
          <div className={styles.formRow}>
            <label htmlFor="acc">{t(language, 'init_acc')}</label>
            <span className={styles.fieldHint}>{t(language, 'init_acc_hint')}</span>
            <input id="acc" type="text" inputMode="decimal" value={accInput} onChange={(e) => setAccInput(e.target.value)} placeholder="0" />
          </div>
          <div className={styles.formRow}>
            <label htmlFor="malak">{t(language, 'init_savings')}</label>
            <span className={styles.fieldHint}>{t(language, 'init_savings_hint')}</span>
            <input id="malak" type="text" inputMode="decimal" value={malakInput} onChange={(e) => setMalakInput(e.target.value)} placeholder="5200" />
          </div>
          <button type="button" className={styles.saveBtn} onClick={handleSaveInitial}>
            {t(language, 'save')}
          </button>
        </div>
      ) : null}

      <div className={styles.metrics}>
        <MetricCard label="Acc" value={fmt(acc)} subtitle={t(language, 'cur_acc_bal')} positive={false} negative={false} />
        <MetricCard
          label="WIH"
          value={fmt(wih)}
          subtitle={`${t(language, 'wih_sub')} (${fmt(malakRemaining)})`}
          positive={wih >= 0}
          negative={wih < 0}
        />
        <MetricCard
          label="R*"
          value={fmt(r)}
          subtitle={t(language, 'r_sub')}
          positive={r >= 0}
          negative={r < 0}
          highlight
        />
        <MetricCard
          label={t(language, 'daily')}
          value={dailyBudget}
          subtitle={`${daysLeft} ${t(language, 'days_left')}`}
          positive={r >= 0}
          negative={r < 0}
        />
      </div>

      <div className={styles.gridColumns}>
        <div className={styles.columnLeft}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t(language, 'transactions')}</h2>
            <div className={styles.card}>
              <div className={styles.txHeader}>
                <button type="button" className={styles.txCta} onClick={() => setShowTxForm(!showTxForm)}>
                  {showTxForm ? t(language, 'cancel') : t(language, 'add_tx')}
                </button>
              </div>

              {showTxForm && (
                <div className={styles.txForm}>
                  <div className={styles.formRow}>
                    <label>{t(language, 'tx_type')}</label>
                    <select value={txType} onChange={e => setTxType(e.target.value)}>
                      <option value="EXPENSE">{t(language, 'type_expense')}</option>
                      <option value="INCOME">{t(language, 'type_income')}</option>
                      <option value="MALAK_SENT">{t(language, 'type_malak')}</option>
                    </select>
                  </div>
                  <div className={styles.formRow}>
                    <label>{t(language, 'tx_amount')}</label>
                    <input type="text" inputMode="decimal" value={txAmt} onChange={e => setTxAmt(e.target.value)} placeholder="0" />
                  </div>
                  <div className={styles.formRow}>
                    <label>{t(language, 'tx_desc')}</label>
                    <input type="text" value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="..." />
                  </div>
                  <button type="button" className={styles.saveBtn} onClick={handleAddTransaction}>{t(language, 'save_tx')}</button>
                </div>
              )}

              {transactions.length === 0 ? (
                <p className={styles.emptyHint}>{t(language, 'no_tx')}</p>
              ) : (
                <ul className={styles.txList}>
                  {transactions.slice().reverse().map(t => (
                    <li key={t.id} className={styles.txItem}>
                      <div className={styles.txInfo}>
                        <span className={styles.txDesc}>{t.desc_text}</span>
                        <span className={`${styles.txTypeBadge} ${styles['badge' + t.type]}`}>{t.type === 'MALAK_SENT' ? 'MALAK' : t.type}</span>
                      </div>
                      <div className={styles.txRight}>
                        <span className={styles.txAmount} style={{ 
                          color: t.type === 'INCOME' ? 'var(--green)' : 'var(--text)' 
                        }}>
                          {t.type === 'INCOME' ? '+' : '−'}{fmt(t.amount)}
                        </span>
                        <button type="button" className={styles.txDel} onClick={() => deleteTx(t.id)}>×</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className={styles.columnRight}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Bills this month</h2>
            <div className={styles.card}>
              {bills.map((b) => {
                const isPaid = paidBills.includes(b.id);
                return (
                  <Row
                    key={b.id}
                    label={b.name}
                    value={fmt(b.amount)}
                    checked={isPaid}
                    onCheck={() => toggleBill(year, month, b.id)}
                    color={isPaid ? 'var(--muted)' : undefined}
                  />
                );
              })}
              <div className={styles.divider} />
              <Row label="K (Unpaid Bills)" value={fmt(k)} positive color="var(--amber)" />
              <Row label="R*" value={fmt(r)} bold positive={r >= 0} negative={r < 0} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
