# 📘 Smart Personal Finance Tracker  
## Project Specification

---

# 1. Overview

This document defines the **technical and functional specifications** of the Smart Personal Finance Tracker.

The system focuses on:
- Accurate transaction tracking
- Receipt-based data extraction
- Subscription lifecycle management
- Financial visibility (actual + recurring)

---

# 2. System Modules

## 2.1 Authentication
- Email/password login via Supabase
- Auto profile creation
- Single-user focused (no multi-tenant complexity)

---

## 2.2 Transactions Module

### Features
- Create, update, delete transactions
- Filter by date, category, type
- Search by merchant
- Link to receipt or subscription billing

### Fields
- id
- amount
- type (expense/income)
- category_id
- merchant_name
- transaction_date
- source
- note

---

## 2.3 Receipt Module

### Input
- Raw text (Apple Pay / SMS)

### Processing
- Parse:
  - merchant
  - amount
  - date

### Output
- Preview UI
- Editable fields
- Confirm → transaction

### States
- parsed
- confirmed
- failed
- discarded

---

## 2.4 Subscriptions Module

### Features
- Create/edit/delete subscription
- Pause / cancel subscription
- Track renewal cycle

### Fields
- name
- amount
- billing_cycle
- next_billing_date
- status

---

## 2.5 Subscription Billing Module

### Features
- Generate billing occurrences
- Track payment status
- Link to transactions

### States
- scheduled
- due
- paid
- failed
- skipped
- cancelled

---

## 2.6 Dashboard Module

### Displays
- total expenses
- total income
- net balance
- subscription monthly cost
- upcoming renewals

---

# 3. Business Logic

## Transactions
- Represent actual financial events
- Must belong to user
- Can be soft deleted

## Subscriptions
- Represent recurring rules
- Do NOT count as expenses directly

## Billing
- Generated from subscriptions
- Becomes expense when paid

---

# 4. Automation Rules

## Billing Generation
- On subscription creation → create first billing
- On payment → generate next billing

## Sync Rules
- Transaction → marks billing paid
- Transaction → confirms receipt

---

# 5. Data Constraints

- Users can only access own data
- Category must belong to user
- Billing must belong to user
- Receipt must belong to user

---

# 6. Non-Functional Requirements

## Performance
- Fast query on transactions
- Indexed by user_id and date

## Security
- RLS enabled on all tables
- Auth enforced via Supabase

## Reliability
- Triggers ensure data consistency

---

# 7. Future Extensions

- OCR image parsing
- AI categorization
- Subscription detection
- Budget tracking
- Notifications

---

# 8. Tech Stack

- Next.js (frontend)
- Supabase (backend)
- PostgreSQL (database)
- Tailwind CSS (UI)

---

# 9. Status

- Specification defined
- Schema implemented
- Ready for development
