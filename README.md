# Awallet (Budget Tracker)

Awallet is a personal budget-tracking web app for logging recurring bills, monthly income/expense records, and visualizing spending trends. It's a single-page React app backed by Supabase (Postgres + Auth), installable as a PWA for offline/mobile use.

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white)
![Recharts](https://img.shields.io/badge/Charts-Recharts-8884d8)
![PWA](https://img.shields.io/badge/PWA-enabled-5A0FC8)

## Key Features

- **Authentication** — email-based sign-up/login via Supabase Auth (`Auth.js`)
- **Bills & monthly records** — track recurring bills and per-month income/expense entries, persisted in Postgres
- **Overview dashboard** — spending breakdown and trends rendered with Recharts (`Overview.js`)
- **History view** — chronological log of past transactions/records (`History.js`)
- **Internationalization** — lightweight i18n layer (`i18n.js`)
- **Settings** — user/account preferences (`Settings.js`)
- **Offline-ready PWA** — service worker (`public/sw.js`) for installability and asset caching
- **Ambient UI** — animated background layer (`AmbientBackground.js`) for a modern visual feel

## Project Structure

```
Awallet/
├── public/
│   ├── index.html            # HTML shell
│   ├── sw.js                 # Service worker (PWA)
│   └── wallet-svgrepo-com.svg
├── src/
│   ├── App.js                 # Root component & routing/layout
│   ├── Auth.js                 # Supabase auth (sign up / log in)
│   ├── BudgetContext.js        # Shared budget state (React Context)
│   ├── Overview.js             # Dashboard / charts
│   ├── History.js              # Transaction history view
│   ├── Settings.js             # User settings
│   ├── AmbientBackground.js    # Decorative animated background
│   ├── i18n.js                 # Translations
│   ├── storage.js              # Local/Supabase persistence helpers
│   └── supabaseClient.js       # Supabase client init (reads env vars)
├── database_setup.sql          # Postgres schema for Supabase project
├── .env.example                # Env var template
└── vercel.json                 # Vercel deployment config
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) project (free tier is enough)

### Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase project credentials:

```bash
cp .env.example .env
```

```
REACT_APP_SUPABASE_URL=your-supabase-project-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database Setup

Run `database_setup.sql` against your Supabase project (SQL Editor or `psql`) to create the required tables (`profiles`, `bills`, `monthly_records`, ...).

### Installation & Development

```bash
npm install
npm start        # runs the app at http://localhost:3000
```

### Build

```bash
npm run build     # production build in build/
```

## Testing

```bash
npm test
```

Uses the default Create React App / Jest + React Testing Library setup.

## Deployment

Configured for [Vercel](https://vercel.com) via `vercel.json` — connect the repo and set the two `REACT_APP_SUPABASE_*` environment variables in the Vercel project settings.
