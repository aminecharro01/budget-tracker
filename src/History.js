import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  YAxis,
} from 'recharts';
import styles from './History.module.css';
import { useBudget, fmt } from './BudgetContext';
import { t } from './i18n';

export default function History() {
  const { computeMetrics, language } = useBudget();

  const today = new Date();
  const data = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const metrics = computeMetrics(y, m);
    
    if (!metrics.hasRecord) continue;
    
      data.push({
      key: `${y}-${m}`,
      label: `${y}-${String(m + 1).padStart(2, '0')}`,
      acc: metrics.acc,
      malakRemaining: metrics.malakRemaining,
      wih: metrics.wih,
      k: metrics.k,
      r: metrics.r,
    });
  }
  data.reverse();

  if (data.length === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t(language, 'history')}</h1>
        </div>
        <p className={styles.empty}>{t(language, 'no_history')}</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t(language, 'history')}</h1>
      </div>

      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>{t(language, 'balance_trends')}</h2>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--muted)" fontSize={12} tickFormatter={(val) => val} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                }}
                itemStyle={{ fontFamily: 'var(--mono)' }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text)' }}
              />
              <Line type="monotone" name="Acc" dataKey="acc" stroke="var(--blue)" strokeWidth={2} dot={{ r: 4, fill: 'var(--blue)' }} activeDot={{ r: 6 }} />
              <Line type="monotone" name="WIH" dataKey="wih" stroke="var(--green)" strokeWidth={2} dot={{ r: 4, fill: 'var(--green)' }} activeDot={{ r: 6 }} />
              <Line type="monotone" name="R*" dataKey="r" stroke="var(--amber)" strokeWidth={2} dot={{ r: 4, fill: 'var(--amber)' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t(language, 'month')}</th>
                <th>Acc</th>
                <th>{t(language, 'savings_rem')}</th>
                <th>WIH</th>
                <th>K*</th>
                <th>R*</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{fmt(row.acc)}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{fmt(row.malakRemaining)}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{fmt(row.wih)}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{fmt(row.k)}</td>
                  <td style={{ fontFamily: 'var(--mono)', color: row.r >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>{fmt(row.r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
