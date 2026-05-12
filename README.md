# Money Finance

Money Finance is a personal finance web app for tracking confirmed spending,
income, subscriptions, receipt imports, and month-level financial visibility.

The project is built around one core idea: not every financial record means the
same thing. A transaction is real money movement, a subscription is a recurring
commitment, and a receipt import is raw input that must be reviewed before it
becomes part of the financial record.

This is a personal-use finance tracker, not a business SaaS product. The focus
is accuracy, clarity, and a low-friction daily workflow.

## What It Does

- Tracks income and expense transactions
- Separates confirmed transactions from future subscription obligations
- Imports Apple Pay / bank receipt text and turns it into editable transaction
  previews
- Keeps receipt imports reviewable before they affect financial totals
- Shows a protected dashboard with monthly spending, income, net balance,
  category breakdowns, recent transactions, and upcoming renewals
- Uses Supabase auth, PostgreSQL constraints, triggers, and RLS policies to keep
  user data scoped and predictable

## Product Model

Money Finance separates financial data into three layers:

1. Transactions
   - Confirmed financial events that already happened
   - Used for spending, income, dashboard totals, charts, and history
   - Can be manually created or generated after confirming a receipt import

2. Subscriptions
   - Recurring rules such as monthly or yearly commitments
   - Do not count as expenses by themselves
   - Generate billing occurrences that become real expenses only when paid

3. Receipt Imports
   - Raw pasted receipt or payment text
   - Parsed into merchant, amount, date, time, payment method, and suggested
     category
   - Must be reviewed and confirmed before a transaction is created

## Current Features

- Email/password sign-in with Supabase Auth
- Protected dashboard and transaction routes
- Current-month financial summary
- Daily cash-flow chart
- Expense category chart
- Recent transaction list
- Upcoming subscription renewals
- Manual transaction creation
- Transaction filtering and soft deletion
- Receipt text parsing, editing, confirmation, and discard flow
- Supabase migration with tables, indexes, RLS policies, ownership validation,
  profile creation, default categories, and subscription billing triggers

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Recharts

## Project Structure

```text
app/          Next.js routes and server actions
components/   Reusable UI and feature components
context/      Product, specification, and coding context
database/     Main database schema reference
lib/          Supabase clients, data access, types, formatters, and parsers
supabase/     Supabase CLI config and migrations
```

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Set the required Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Database

The Supabase migration lives in:

```text
supabase/migrations/20260416213455_initial_schema.sql
```

It defines the core finance tables:

- profiles
- categories
- transactions
- receipt_imports
- subscriptions
- subscription_billings

The migration also enables RLS, adds ownership policies, validates category and
receipt ownership, seeds default categories, and synchronizes receipt and
subscription billing state with transactions.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Security Notes

- Real environment files are ignored by Git.
- `.env.example` is safe to commit because it contains empty placeholders.
- The Supabase anon key is expected to be used by the frontend, but privileged
  service-role keys must never be committed.
- User data isolation is enforced through Supabase RLS policies and database
  ownership checks.

## Status

This repository contains the first functional slice of the app: authentication,
dashboard, transaction management, receipt text import, and the initial
Supabase schema. Future work can expand subscription management screens,
budgets, savings goals, notifications, and smarter categorization.
