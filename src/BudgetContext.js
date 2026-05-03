import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';

const BudgetContext = createContext();

export function useBudget() {
  return useContext(BudgetContext);
}

export function mkey(year, month) {
  return `${year}_${month}`;
}

export function fmt(n) {
  return Math.round(Number(n) || 0).toLocaleString();
}

export function BudgetProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(() => localStorage.getItem('budget_lang') || 'en');
  
  useEffect(() => {
    localStorage.setItem('budget_lang', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Data State
  const [bills, setBills] = useState([]);
  const [records, setRecords] = useState({});
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    } else {
      setLoading(false);
      setBills([]);
      setRecords({});
      setTransactions([]);
    }
  }, [session]);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Fetch Bills
      const { data: billsData } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: true });
      setBills(billsData || []);

      // 2. Fetch Monthly Records
      const { data: recordsData } = await supabase
        .from('monthly_records')
        .select('*');
      
      const recordsMap = {};
      (recordsData || []).forEach(r => {
        recordsMap[r.year_month] = r;
      });
      setRecords(recordsMap);

      // 3. Fetch Transactions (Paginated: last 12 months)
      const date12MonthsAgo = new Date();
      date12MonthsAgo.setMonth(date12MonthsAgo.getMonth() - 12);
      
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .gte('date_created', date12MonthsAgo.toISOString())
        .order('date_created', { ascending: true });
      setTransactions(txData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  // --- Mutators ---

  const saveInitial = useCallback(async (year, month, initialAcc, initialMalak) => {
    if (!session) return;
    const key = mkey(year, month);
    const existing = records[key];
    
    if (existing) {
      const { error, data } = await supabase
        .from('monthly_records')
        .update({ initial_acc: initialAcc, initial_malak: initialMalak })
        .eq('id', existing.id)
        .select()
        .single();
      if (!error && data) {
        setRecords(prev => ({ ...prev, [key]: data }));
      }
    } else {
      const { error, data } = await supabase
        .from('monthly_records')
        .insert({
          user_id: session.user.id,
          year_month: key,
          initial_acc: initialAcc,
          initial_malak: initialMalak,
          paid_bills: []
        })
        .select()
        .single();
      if (!error && data) {
        setRecords(prev => ({ ...prev, [key]: data }));
      }
    }
  }, [records, session]);

  const saveBill = useCallback(async (name, amount) => {
    if (!session) return;
    const { data, error } = await supabase
      .from('bills')
      .insert({ user_id: session.user.id, name, amount })
      .select()
      .single();
    if (!error && data) {
      setBills(prev => [...prev, data]);
    }
  }, [session]);

  const deleteBill = useCallback(async (id) => {
    await supabase.from('bills').delete().eq('id', id);
    setBills(prev => prev.filter(b => b.id !== id));
  }, []);

  const toggleBill = useCallback(async (year, month, billId) => {
    const key = mkey(year, month);
    const existing = records[key];
    if (!existing) return;

    const isPaid = (existing.paid_bills || []).includes(billId);
    const nextPaid = isPaid 
      ? existing.paid_bills.filter(x => x !== billId) 
      : [...(existing.paid_bills || []), billId];

    const { data, error } = await supabase
      .from('monthly_records')
      .update({ paid_bills: nextPaid })
      .eq('id', existing.id)
      .select()
      .single();

    if (!error && data) {
      setRecords(prev => ({ ...prev, [key]: data }));
    }
  }, [records]);

  const addTransaction = useCallback(async (year, month, type, amount, desc) => {
    if (!session) return;
    const key = mkey(year, month);
    let monthRecord = records[key];

    if (!monthRecord) {
      const { data, error } = await supabase
        .from('monthly_records')
        .insert({
          user_id: session.user.id,
          year_month: key,
          initial_acc: 0,
          initial_malak: 0,
          paid_bills: []
        })
        .select()
        .single();
      
      if (error || !data) return;
      monthRecord = data;
      setRecords(prev => ({ ...prev, [key]: monthRecord }));
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: session.user.id,
        month_id: monthRecord.id,
        type,
        amount,
        desc_text: desc
      })
      .select()
      .single();

    if (!error && data) {
      setTransactions(prev => [...prev, data]);
    }
  }, [records, session]);

  const deleteTx = useCallback(async (id) => {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  // --- Metrics Computation ---
  
  const computeMetrics = useCallback((year, month) => {
    const key = mkey(year, month);
    const rec = records[key];
    
    let initialAcc = rec ? Number(rec.initial_acc) : 0;
    let initialMalak = rec ? Number(rec.initial_malak) : 0;
    const paidBills = rec ? (rec.paid_bills || []) : [];
    
    const monthTxs = rec ? transactions.filter(t => t.month_id === rec.id) : [];

    let totalAcc = initialAcc;
    let malakRemaining = initialMalak;
    
    for (const t of monthTxs) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'INCOME') totalAcc += amt;
      else if (t.type === 'EXPENSE') totalAcc -= amt;
      else if (t.type === 'MALAK_SENT') {
        totalAcc -= amt;
        malakRemaining -= amt;
      }
    }

    const paidBillsTotal = bills
      .filter(b => paidBills.includes(b.id))
      .reduce((s, b) => s + (Number(b.amount) || 0), 0);
    
    totalAcc -= paidBillsTotal;

    const wih = totalAcc - malakRemaining;
    
    const k = bills
      .filter((b) => !paidBills.includes(b.id))
      .reduce((s, b) => s + (Number(b.amount) || 0), 0);
      
    const r = wih - k;
    
    return {
      initialAcc,
      initialMalak,
      acc: totalAcc,
      malakRemaining,
      wih,
      k,
      r,
      paidBills,
      transactions: monthTxs,
      hasRecord: !!rec
    };
  }, [records, transactions, bills]);

  const getPreviousMalakRemaining = useCallback((year, month) => {
    let m = month - 1;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    
    const prevKey = mkey(y, m);
    const prevRec = records[prevKey];
    
    if (prevRec) {
      const { malakRemaining } = computeMetrics(y, m);
      return malakRemaining;
    }
    return 5200;
  }, [records, computeMetrics]);

  const value = useMemo(() => ({
    session,
    loading,
    language,
    setLanguage,
    bills,
    records,
    transactions,
    saveInitial,
    saveBill,
    deleteBill,
    toggleBill,
    addTransaction,
    deleteTx,
    getPreviousMalakRemaining,
    computeMetrics,
    signOut: () => supabase.auth.signOut()
  }), [session, loading, language, bills, records, transactions, saveInitial, saveBill, deleteBill, toggleBill, addTransaction, deleteTx, getPreviousMalakRemaining, computeMetrics]);

  return (
    <BudgetContext.Provider value={value}>
      {!loading && children}
      {loading && <div style={{ padding: '2rem', textAlign: 'center' }}>Loading budget data...</div>}
    </BudgetContext.Provider>
  );
}
