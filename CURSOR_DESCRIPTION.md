# Budget Tracker — Full Project Description for Cursor

## What This App Does

A personal budget tracker built as a React web app. It replicates a specific budgeting logic the user had in a spreadsheet:

- **Acc** — the total account balance received (e.g. salary or income)
- **Debt** — money borrowed from someone (a specific person named Malak) that needs to be deducted
- **WIH (What I Have)** — `Acc - Debt` — real available balance after repaying debt
- **K (Keep)** — the sum of bills marked as "keep aside" (bills that must be reserved, not spent)
- **R* (Real)** — `WIH - K` — the money the user can actually spend freely

The app is month-based: for each month, the user logs their Acc and Debt. Bills are global (same every month) but split into two types: regular bills and K-type bills (kept aside). R* is always shown prominently in the sidebar.

---

## Tech Stack

- **React 18** (Create React App)
- **CSS Modules** for scoped styling (no Tailwind, no styled-components)
- **Recharts** for the bar chart in the History tab
- **localStorage** for persistence (no backend, no database)
- **Google Fonts**: Sora (UI font) + DM Mono (numbers/monospace)

---

## File Structure

```
budget-tracker/
├── public/
│   └── index.html          # Loads Google Fonts, mounts #root
├── src/
│   ├── index.js            # ReactDOM.createRoot entry point
│   ├── index.css           # Global CSS variables, reset, scrollbar, fonts
│   ├── storage.js          # localStorage wrapper + shared constants
│   ├── App.js              # Root component: sidebar layout + tab routing
│   ├── App.module.css      # Sidebar, logo, nav, shell layout styles
│   ├── Overview.js         # Tab 1: month navigator, income form, WIH/R* metrics, bills list
│   ├── Overview.module.css
│   ├── Bills.js            # Tab 2: add/delete recurring bills, K vs regular toggle
│   ├── Bills.module.css
│   ├── History.js          # Tab 3: bar chart + table of all tracked months
│   └── History.module.css
├── package.json
└── README.md
```

---

## Design System

The app uses a **dark theme** with CSS custom properties defined in `index.css`:

```css
--bg: #0f0f0f           /* page background */
--surface: #1a1a1a      /* card/panel background */
--surface2: #242424     /* elevated surface / hover states */
--border: rgba(255,255,255,0.07)
--border2: rgba(255,255,255,0.13)
--text: #f0ede8         /* primary text */
--muted: #888580        /* secondary/label text */
--hint: #555250         /* disabled/hint text */
--green: #3ecf8e        /* positive values, R* when >= 0 */
--red: #f06a6a          /* negative values, debt */
--blue: #5b9cf6         /* account balance */
--amber: #f0a347        /* K values in chart tooltip */
--green-dim / --red-dim / --blue-dim  /* 12% opacity fills for badges */
--radius: 10px
--radius-lg: 14px
--font: 'Sora', sans-serif
--mono: 'DM Mono', monospace  /* used for all number display */
```

Numbers are always displayed in `DM Mono` font via the `fmt()` utility. Positive values are green, negative are red.

---

## `storage.js` — Data Layer

All persistence goes through this module. It wraps localStorage with a `budget_` prefix.

**Key functions:**
```js
storage.get(key)       // → parsed JSON or null
storage.set(key, val)  // → JSON.stringify to localStorage
storage.remove(key)    // → removes key

mkey(year, month)      // → "month_2026_4" (key for per-month data)
BILLS_KEY              // → "bills" (key for global bills array)
fmt(n)                 // → Math.round + toLocaleString, e.g. "6,806"
```

**Data shapes:**

Monthly income record (stored at key `month_YYYY_M`):
```js
{ acc: 6806, debt: 600 }
```

Bills array (stored at key `bills`):
```js
[
  { id: 1, name: 'House', amount: 1100, type: 'regular' },
  { id: 2, name: 'Wifi',  amount: 190,  type: 'K' },
  ...
]
```
- `type: 'K'` bills are summed to compute K (kept aside), deducted from WIH to get R*
- `type: 'regular'` bills appear in the list but don't affect R*

**Default seed data** (applied on first load):
- Bills: House 1100, Wifi 190 (K), Electricity 30 (K), Tram 160, Mobile 50
- May 2026: acc=6806, debt=600

---

## `App.js` — Shell & Routing

The root layout is a two-column flexbox: a fixed 220px sidebar on the left, a scrollable main area on the right.

**State:**
- `tab` — `'overview' | 'bills' | 'history'`
- `year`, `month` — currently viewed month (integers; month is 0-indexed)
- `forceUpdate` — dummy state counter used to re-render when `budget-update` event fires

**Cross-component communication:** When any component mutates localStorage (saves income, adds/removes a bill), it dispatches `window.dispatchEvent(new Event('budget-update'))`. `App.js` listens and increments `forceUpdate`, causing a re-render that picks up updated values for the sidebar R* card.

**Sidebar contents:**
1. Logo (₿ mark + "Budget" text)
2. R* card — always shows real money for the currently viewed month
3. Nav buttons: Overview, Bills, History (with inline SVG icons)
4. Footer note about localStorage

**Tab rendering:** Uses conditional rendering (`{tab === 'overview' && <Overview ... />}`). Overview gets a `key={year-month}` prop so it fully remounts when the month changes, resetting local form state cleanly.

---

## `Overview.js` — Tab 1

**Props:** `year`, `month`, `onMonthChange(dir)`

**Local state:** `showForm` (boolean), `acc` and `debt` (string inputs)

**Reads from storage on every render** (no local copy of bills/data — always fresh from localStorage).

**Layout:**
1. Month navigator row (← arrow, month label, → arrow, + Income button)
2. Collapsible income form (acc + debt inputs, Save button) — animates in with CSS `slideDown`
3. Three metric cards: Acc (blue), WIH (green/red), R* (green/red, highlighted)
4. "Income" section — breakdown list showing Acc, Debt deduction, WIH total
5. "Bills this month" section — all bills from storage with K badges, then K total and R* total

**`MetricCard` sub-component:** Renders a metric with label, large monospace value (colored), and a subtitle hint.

**`Row` sub-component:** A flex row with label (+ optional badge) on the left, value on the right. Accepts `positive`, `negative`, `bold`, `badge`, `color` props.

---

## `Bills.js` — Tab 2

**Local state:** `bills` array (loaded from storage in `useEffect`), form fields (`name`, `amount`, `type`), `showForm`

**Actions:**
- `saveBill()` — validates name + amount, pushes new bill to array, saves to storage, dispatches `budget-update`
- `deleteBill(id)` — filters array by id, saves, dispatches

**Bill type select:** Two options — `"regular"` (affects total only) and `"K"` (affects both total and K sum).

**Footer summary:** Shows K total (green) and full monthly bill total.

---

## `History.js` — Tab 3

**No props.** Loads all data in `useEffect` on mount.

**Logic:** Iterates the last 12 months backward from today. For each month, checks if a record exists in storage. If it does, computes `wih = acc - debt` and `r = wih - k` (using the current bills' K sum) and pushes to the `history` array.

**Chart:** Recharts `BarChart` with a `ResponsiveContainer`. Each bar represents one month's R*. Bar color is per-cell: green (`#3ecf8e`) if R* >= 0, red (`#f06a6a`) if negative. Custom tooltip shows all 5 values (Acc, Debt, WIH, K, R*).

**Table:** Grid layout with columns: Month | Acc | Debt | WIH | R*. R* column is colored green/red. Debt shows `—` if zero.

---

## Styling Conventions

- Every component has its own `.module.css` file
- No global class names except the CSS variables in `index.css`
- All animations are CSS keyframes (`slideDown` for forms)
- Hover states use `background: var(--surface2)` for lift effect
- Buttons: green CTA style (`background: var(--green); color: #0f0f0f`) or ghost style (border + transparent bg)
- Monospace font (`var(--mono)`) is used on all displayed numbers, axis labels, and the month label in the nav
- Border radius: `var(--radius)` (10px) for inputs/buttons, `var(--radius-lg)` (14px) for cards/panels

---

## Running the App

```bash
npm install     # installs React, react-scripts, recharts
npm start       # opens http://localhost:3000
npm run build   # creates /build folder for static deployment
```

No environment variables, no API keys, no backend. Fully offline after initial load.

---

## Common Extension Points

If you want to extend this app in Cursor, here are the key areas:

| Feature | Where to change |
|---|---|
| Add a new bill type (e.g. "savings") | `storage.js` (add type constant), `Bills.js` (add select option), `Overview.js` (update K logic) |
| Export data to CSV | Add a button in `History.js`, iterate `history` array, use `Blob` + `URL.createObjectURL` |
| Add spending notes per month | Extend the month data shape in `storage.js` `{ acc, debt, notes: '' }`, add textarea to `Overview.js` form |
| Switch to a backend/database | Replace `storage.js` functions with `fetch()` calls to your API — all components already call through this module |
| Add categories to bills | Add a `category` field to the bill object in `Bills.js`, group by category in `Overview.js` |
| Dark/light mode toggle | CSS variables already support it — add a class toggle on `<body>` and define a `[data-theme="light"]` block in `index.css` |
| Multi-currency support | Add a currency field to `storage.js` defaults, thread it through `fmt()` using `Intl.NumberFormat` |
