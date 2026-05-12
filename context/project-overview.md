# 🧠 Smart Personal Finance Tracker  
## Project Overview (Final Version)

---

# 1. 🎯 Purpose

This is a **personal-use finance tracking application** designed to:

- Track daily expenses and income
- Automatically extract transaction data from **Apple Pay / receipt text**
- Track **subscriptions as recurring financial commitments**
- Combine **actual spending + future obligations**
- Provide a **clear financial overview**, not just raw logs

> This is NOT a business SaaS.  
> It is optimized for **accuracy, automation, and clarity for a single user**.

---

# 2. 🧩 Core Philosophy

> 💡 *“Not all expenses are the same.”*

The system separates:

### 1. Transactions (Reality)
- What already happened
- Real money movement

### 2. Subscriptions (Commitments)
- What WILL happen
- Recurring obligations

### 3. Receipt Imports (Raw Input)
- Unstructured → structured data

---

# 3. 🏗️ System Architecture

## Main Data Flow

Receipt Text → receipt_imports → user confirms → transactions  
Subscriptions → subscription_billings → (paid) → transactions

---

## Core Entities

- profiles → user settings  
- categories → classify transactions  
- transactions → actual financial events  
- receipt_imports → raw parsed receipts  
- subscriptions → recurring rules  
- subscription_billings → generated occurrences  

---

# 4. ⚙️ Features Breakdown

## 4.1 Transactions System

Track all real financial activity.

Sources:
- Manual entry
- Receipt parsing
- Subscription payments

Transactions are:
- editable
- soft deletable
- the single source of truth

---

## 4.2 Receipt Parsing

Flow:
1. Paste receipt text  
2. Parse merchant, amount, date  
3. Show preview  
4. User edits  
5. Confirm → transaction created  

Rules:
- Always store raw text  
- Never trust parsing blindly  

---

## 4.3 Subscription System

### Core Idea

A subscription is NOT an expense → it generates expenses.

---

### Subscription (Rule)

Example:
- Netflix
- 39 SAR
- Monthly

Stored in: subscriptions

---

### Billing (Occurrence)

Example:
- April 20
- May 20

Stored in: subscription_billings

---

### Billing States

- scheduled
- due
- paid
- failed
- skipped
- cancelled

---

### Flow

1. Billing created  
2. Payment happens  
3. Transaction created  
4. Billing marked paid  
5. Next billing generated  

---

# 5. 📊 Dashboard Logic

Shows:

- total spent
- total income
- net balance
- subscription monthly cost
- upcoming renewals
- combined financial view

---

# 6. 🧠 Smart Features (Future)

- auto categorization
- subscription detection
- smarter receipt parsing
- financial insights

---

# 7. 🖥️ UI Structure

- Dashboard  
- Transactions  
- Add Transaction  
- Receipt Import  
- Subscriptions  
- Subscription Details  

---

# 8. 🧱 Data Integrity

- strict ownership validation
- user-only data access
- enforced via RLS + triggers

---

# 9. 🔁 Automation

- billing auto-generation
- payment → billing sync
- receipt → transaction sync

---

# 10. 🧪 MVP Scope

- auth
- transactions
- receipt parsing
- subscriptions
- dashboard

---

# 11. 🧰 Tech Stack

- Next.js
- Supabase
- Tailwind
- TanStack Query

---

# 12. 🚀 Value

- track real spending
- understand subscriptions
- reduce financial blind spots
- automate expense tracking

---

# 13. 📍 Status

- product defined
- schema ready
- migration ready
- ready to build
