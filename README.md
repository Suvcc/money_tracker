Money Finance is a personal finance web app for tracking real transactions,
subscriptions, and month-level financial visibility.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables:

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current app slice

- email/password sign-in backed by Supabase auth
- protected dashboard route
- current-month finance summary
- monthly cash-flow chart
- expense category chart
- recent transactions
- upcoming subscription renewals

## Project notes

- database schema lives in `database/schema.sql`
- product and coding context lives in `context/`
- soft-deleted finance rows must stay excluded at query time

## Commands

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
