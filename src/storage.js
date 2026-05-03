const PREFIX = 'budget_';

export const BILLS_KEY = 'bills';

export function mkey(year, month) {
  return `month_${year}_${month}`;
}

export function fmt(n) {
  return Math.round(Number(n) || 0).toLocaleString();
}

export const storage = {
  get(key) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set(key, val) {
    localStorage.setItem(PREFIX + key, JSON.stringify(val));
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },
};

const DEFAULT_BILLS = [
  { id: 1, name: 'House', amount: 1100 },
  { id: 2, name: 'Wifi', amount: 190 },
  { id: 3, name: 'Electricity', amount: 30 },
  { id: 4, name: 'Tram', amount: 160 },
  { id: 5, name: 'Mobile', amount: 50 },
];

export function initDefaults() {
  if (storage.get(BILLS_KEY) === null) {
    storage.set(BILLS_KEY, DEFAULT_BILLS);
  }
  const may2026 = mkey(2026, 4);
  if (storage.get(may2026) === null) {
    storage.set(may2026, { 
      initialAcc: 7700, 
      initialMalak: 5200, 
      transactions: [], 
      paidBills: [] 
    });
  }
}

/** Get the initial Malak amount to initialize the next month. */
export function getPreviousMalakRemaining(year, month) {
  let m = month - 1;
  let y = year;
  if (m < 0) {
    m = 11;
    y -= 1;
  }
  const prevRec = storage.get(mkey(y, m));
  if (prevRec) {
    const { malakRemaining } = computeMetrics(y, m);
    return malakRemaining;
  }
  return 5200; // default base if no previous month found
}

export function getKSum(bills, paidBills = []) {
  return (bills || [])
    .filter((b) => !paidBills.includes(b.id))
    .reduce((s, b) => s + (Number(b.amount) || 0), 0);
}

export function computeMetrics(year, month) {
  const bills = storage.get(BILLS_KEY) || [];
  const rec = storage.get(mkey(year, month));
  
  let initialAcc = 0;
  let initialMalak = 0;
  let transactions = [];
  let paidBills = [];
  
  if (rec) {
    // Map legacy data to new schema if needed
    initialAcc = rec.initialAcc != null ? Number(rec.initialAcc) : (Number(rec.acc) || 0);
    
    // For legacy malak, we want to try to extract the remaining value
    if (rec.initialMalak != null) {
      initialMalak = Number(rec.initialMalak);
    } else if (rec.malakBase != null) {
      initialMalak = Number(rec.malakBase) - (Number(rec.malakReturned) || 0);
    } else if (rec.malak != null) {
      initialMalak = Number(rec.malak);
    } else {
      initialMalak = 5800;
    }
    
    transactions = rec.transactions || [];
    paidBills = rec.paidBills || [];
  }

  let totalAcc = initialAcc;
  let malakRemaining = initialMalak;
  
  // Apply transactions
  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    if (t.type === 'INCOME') {
      totalAcc += amt;
    } else if (t.type === 'EXPENSE') {
      totalAcc -= amt;
    } else if (t.type === 'MALAK_SENT') {
      totalAcc -= amt;
      malakRemaining -= amt;
    }
  }

  // Deduct paid bills from totalAcc
  const paidBillsTotal = bills
    .filter(b => paidBills.includes(b.id))
    .reduce((s, b) => s + (Number(b.amount) || 0), 0);
  
  totalAcc -= paidBillsTotal;

  const wih = totalAcc - malakRemaining;
  const k = getKSum(bills, paidBills);
  const r = wih - k;
  
  return { 
    initialAcc,
    initialMalak,
    acc: totalAcc, // Final calculated account balance
    malakRemaining, // Final calculated malak pool
    wih, 
    k, 
    r, 
    paidBills,
    transactions,
    hasRecord: !!rec,
  };
}
