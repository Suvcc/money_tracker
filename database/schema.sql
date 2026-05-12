-- =========================================================
-- Smart Personal Finance Tracker
-- Full Long-Term SQL Migration
-- Supabase PostgreSQL
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- 1) Shared updated_at trigger function
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- 2) profiles
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  preferred_currency text not null default 'SAR',
  timezone text not null default 'Asia/Riyadh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- =========================================================
-- 3) categories
-- =========================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('expense', 'income')),
  color text,
  icon text,
  is_default boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_user_name_type_unique unique (user_id, name, type)
);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

-- =========================================================
-- 4) receipt_imports
-- =========================================================

create table if not exists public.receipt_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  input_type text not null check (input_type in ('text', 'image')),
  raw_text text not null,

  parsed_merchant_name text,
  parsed_amount numeric(12,2) check (parsed_amount is null or parsed_amount >= 0),
  parsed_currency text,
  parsed_transaction_date date,
  parsed_transaction_time time,
  parsed_payment_method text,
  parsed_category_name text,

  parser_status text not null default 'parsed'
    check (parser_status in ('parsed', 'failed', 'confirmed', 'discarded')),

  parser_confidence numeric(5,2)
    check (
      parser_confidence is null
      or (parser_confidence >= 0 and parser_confidence <= 100)
    ),

  parser_version text,
  confirmed_transaction_id uuid unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_receipt_imports_updated_at on public.receipt_imports;
create trigger trg_receipt_imports_updated_at
before update on public.receipt_imports
for each row
execute function public.set_updated_at();

-- =========================================================
-- 5) subscriptions
-- =========================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,

  name text not null,
  vendor text,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'SAR',

  billing_cycle text not null
    check (billing_cycle in ('weekly', 'monthly', 'quarterly', 'yearly')),

  interval_count integer not null default 1 check (interval_count > 0),

  start_date date not null,
  next_billing_date date not null,
  end_date date,

  status text not null default 'active'
    check (status in ('active', 'paused', 'cancelled')),

  payment_method text,
  note text,

  auto_generate_billings boolean not null default true,
  auto_create_transaction boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

-- =========================================================
-- 6) subscription_billings
-- =========================================================

create table if not exists public.subscription_billings (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  billing_date date not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'SAR',

  status text not null default 'scheduled'
    check (status in ('scheduled', 'due', 'paid', 'failed', 'skipped', 'cancelled')),

  transaction_id uuid unique,
  generated_automatically boolean not null default true,
  paid_at timestamptz,
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscription_billings_subscription_date_unique unique (subscription_id, billing_date)
);

drop trigger if exists trg_subscription_billings_updated_at on public.subscription_billings;
create trigger trg_subscription_billings_updated_at
before update on public.subscription_billings
for each row
execute function public.set_updated_at();

-- =========================================================
-- 7) transactions
-- =========================================================

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,

  type text not null check (type in ('expense', 'income')),
  source text not null
    check (source in ('manual', 'receipt_text', 'receipt_image', 'subscription', 'import', 'system')),

  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'SAR',

  merchant_name text,
  note text,

  transaction_date date not null,
  transaction_time time,
  posted_at timestamptz,

  receipt_import_id uuid references public.receipt_imports(id) on delete set null,
  subscription_billing_id uuid unique,

  is_recurring boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

-- =========================================================
-- 8) Remaining foreign keys
-- =========================================================

alter table public.receipt_imports
drop constraint if exists receipt_imports_confirmed_transaction_id_fkey;

alter table public.receipt_imports
add constraint receipt_imports_confirmed_transaction_id_fkey
foreign key (confirmed_transaction_id)
references public.transactions(id)
on delete set null;

alter table public.subscription_billings
drop constraint if exists subscription_billings_transaction_id_fkey;

alter table public.subscription_billings
add constraint subscription_billings_transaction_id_fkey
foreign key (transaction_id)
references public.transactions(id)
on delete set null;

alter table public.transactions
drop constraint if exists transactions_subscription_billing_id_fkey;

alter table public.transactions
add constraint transactions_subscription_billing_id_fkey
foreign key (subscription_billing_id)
references public.subscription_billings(id)
on delete set null;

-- =========================================================
-- 9) Indexes
-- =========================================================

create index if not exists idx_categories_user_id
  on public.categories(user_id);

create index if not exists idx_categories_user_archived
  on public.categories(user_id, is_archived);

create index if not exists idx_receipt_imports_user_id
  on public.receipt_imports(user_id);

create index if not exists idx_receipt_imports_status
  on public.receipt_imports(user_id, parser_status);

create index if not exists idx_subscriptions_user_id
  on public.subscriptions(user_id);

create index if not exists idx_subscriptions_user_status
  on public.subscriptions(user_id, status);

create index if not exists idx_subscriptions_next_billing_date
  on public.subscriptions(user_id, next_billing_date);

create index if not exists idx_subscription_billings_subscription_id
  on public.subscription_billings(subscription_id);

create index if not exists idx_subscription_billings_user_id
  on public.subscription_billings(user_id);

create index if not exists idx_subscription_billings_user_date
  on public.subscription_billings(user_id, billing_date);

create index if not exists idx_subscription_billings_user_status
  on public.subscription_billings(user_id, status);

create index if not exists idx_transactions_user_id
  on public.transactions(user_id);

create index if not exists idx_transactions_user_date
  on public.transactions(user_id, transaction_date desc);

create index if not exists idx_transactions_user_category
  on public.transactions(user_id, category_id);

create index if not exists idx_transactions_user_type
  on public.transactions(user_id, type);

create index if not exists idx_transactions_receipt_import_id
  on public.transactions(receipt_import_id);

create index if not exists idx_transactions_subscription_billing_id
  on public.transactions(subscription_billing_id);

create index if not exists idx_transactions_user_merchant
  on public.transactions(user_id, merchant_name);

-- =========================================================
-- 10) Enable Row Level Security
-- =========================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.receipt_imports enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_billings enable row level security;
alter table public.transactions enable row level security;

-- =========================================================
-- 11) RLS Policies: profiles
-- =========================================================

drop policy if exists "users can view own profile" on public.profiles;
create policy "users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "users can delete own profile" on public.profiles;
create policy "users can delete own profile"
on public.profiles
for delete
using (auth.uid() = id);

-- =========================================================
-- 12) RLS Policies: categories
-- =========================================================

drop policy if exists "users can view own categories" on public.categories;
create policy "users can view own categories"
on public.categories
for select
using (auth.uid() = user_id);

drop policy if exists "users can insert own categories" on public.categories;
create policy "users can insert own categories"
on public.categories
for insert
with check (auth.uid() = user_id);

drop policy if exists "users can update own categories" on public.categories;
create policy "users can update own categories"
on public.categories
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own categories" on public.categories;
create policy "users can delete own categories"
on public.categories
for delete
using (auth.uid() = user_id);

-- =========================================================
-- 13) RLS Policies: receipt_imports
-- =========================================================

drop policy if exists "users can view own receipt imports" on public.receipt_imports;
create policy "users can view own receipt imports"
on public.receipt_imports
for select
using (auth.uid() = user_id);

drop policy if exists "users can insert own receipt imports" on public.receipt_imports;
create policy "users can insert own receipt imports"
on public.receipt_imports
for insert
with check (auth.uid() = user_id);

drop policy if exists "users can update own receipt imports" on public.receipt_imports;
create policy "users can update own receipt imports"
on public.receipt_imports
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own receipt imports" on public.receipt_imports;
create policy "users can delete own receipt imports"
on public.receipt_imports
for delete
using (auth.uid() = user_id);

-- =========================================================
-- 14) RLS Policies: subscriptions
-- =========================================================

drop policy if exists "users can view own subscriptions" on public.subscriptions;
create policy "users can view own subscriptions"
on public.subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "users can insert own subscriptions" on public.subscriptions;
create policy "users can insert own subscriptions"
on public.subscriptions
for insert
with check (auth.uid() = user_id);

drop policy if exists "users can update own subscriptions" on public.subscriptions;
create policy "users can update own subscriptions"
on public.subscriptions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own subscriptions" on public.subscriptions;
create policy "users can delete own subscriptions"
on public.subscriptions
for delete
using (auth.uid() = user_id);

-- =========================================================
-- 15) RLS Policies: subscription_billings
-- =========================================================

drop policy if exists "users can view own subscription billings" on public.subscription_billings;
create policy "users can view own subscription billings"
on public.subscription_billings
for select
using (auth.uid() = user_id);

drop policy if exists "users can insert own subscription billings" on public.subscription_billings;
create policy "users can insert own subscription billings"
on public.subscription_billings
for insert
with check (auth.uid() = user_id);

drop policy if exists "users can update own subscription billings" on public.subscription_billings;
create policy "users can update own subscription billings"
on public.subscription_billings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own subscription billings" on public.subscription_billings;
create policy "users can delete own subscription billings"
on public.subscription_billings
for delete
using (auth.uid() = user_id);

-- =========================================================
-- 16) RLS Policies: transactions
-- =========================================================

drop policy if exists "users can view own transactions" on public.transactions;
create policy "users can view own transactions"
on public.transactions
for select
using (auth.uid() = user_id);

drop policy if exists "users can insert own transactions" on public.transactions;
create policy "users can insert own transactions"
on public.transactions
for insert
with check (auth.uid() = user_id);

drop policy if exists "users can update own transactions" on public.transactions;
create policy "users can update own transactions"
on public.transactions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own transactions" on public.transactions;
create policy "users can delete own transactions"
on public.transactions
for delete
using (auth.uid() = user_id);

-- =========================================================
-- 17) Auto-create profile on signup
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =========================================================
-- 18) Seed default categories on profile creation
-- =========================================================

create or replace function public.seed_default_categories_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, color, icon, is_default)
  values
    (new.id, 'Food & Drinks', 'expense', '#f97316', 'utensils', true),
    (new.id, 'Transport', 'expense', '#0ea5e9', 'car', true),
    (new.id, 'Shopping', 'expense', '#8b5cf6', 'shopping-bag', true),
    (new.id, 'Bills', 'expense', '#ef4444', 'receipt', true),
    (new.id, 'Entertainment', 'expense', '#22c55e', 'film', true),
    (new.id, 'Health', 'expense', '#14b8a6', 'heart-pulse', true),
    (new.id, 'Other', 'expense', '#64748b', 'circle', true),
    (new.id, 'Salary', 'income', '#22c55e', 'wallet', true),
    (new.id, 'Gift', 'income', '#eab308', 'gift', true),
    (new.id, 'Refund', 'income', '#06b6d4', 'rotate-ccw', true),
    (new.id, 'Other', 'income', '#64748b', 'circle', true)
  on conflict (user_id, name, type) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_seed_default_categories_on_profile on public.profiles;
create trigger trg_seed_default_categories_on_profile
after insert on public.profiles
for each row
execute function public.seed_default_categories_for_user();

-- =========================================================
-- 19) Validate category ownership for transactions
-- =========================================================

create or replace function public.validate_transaction_category_ownership()
returns trigger
language plpgsql
as $$
declare
  category_owner uuid;
begin
  if new.category_id is null then
    return new;
  end if;

  select c.user_id
  into category_owner
  from public.categories c
  where c.id = new.category_id;

  if category_owner is null then
    raise exception 'Invalid category_id: category does not exist';
  end if;

  if category_owner <> new.user_id then
    raise exception 'Category does not belong to the same user';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_transaction_category_ownership on public.transactions;
create trigger trg_validate_transaction_category_ownership
before insert or update on public.transactions
for each row
execute function public.validate_transaction_category_ownership();

-- =========================================================
-- 20) Validate category ownership for subscriptions
-- =========================================================

create or replace function public.validate_subscription_category_ownership()
returns trigger
language plpgsql
as $$
declare
  category_owner uuid;
begin
  if new.category_id is null then
    return new;
  end if;

  select c.user_id
  into category_owner
  from public.categories c
  where c.id = new.category_id;

  if category_owner is null then
    raise exception 'Invalid category_id: category does not exist';
  end if;

  if category_owner <> new.user_id then
    raise exception 'Category does not belong to the same user';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_subscription_category_ownership on public.subscriptions;
create trigger trg_validate_subscription_category_ownership
before insert or update on public.subscriptions
for each row
execute function public.validate_subscription_category_ownership();

-- =========================================================
-- 21) Sync receipt import when transaction is created from receipt
-- =========================================================

create or replace function public.sync_receipt_import_confirmation()
returns trigger
language plpgsql
as $$
begin
  if new.receipt_import_id is not null then
    update public.receipt_imports
    set
      confirmed_transaction_id = new.id,
      parser_status = 'confirmed',
      updated_at = now()
    where id = new.receipt_import_id
      and user_id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_receipt_import_confirmation on public.transactions;
create trigger trg_sync_receipt_import_confirmation
after insert on public.transactions
for each row
when (new.receipt_import_id is not null)
execute function public.sync_receipt_import_confirmation();

-- =========================================================
-- 22) Sync subscription billing when transaction is created
-- =========================================================

create or replace function public.sync_subscription_billing_payment()
returns trigger
language plpgsql
as $$
begin
  if new.subscription_billing_id is not null then
    update public.subscription_billings
    set
      transaction_id = new.id,
      status = 'paid',
      paid_at = coalesce(new.posted_at, now()),
      updated_at = now()
    where id = new.subscription_billing_id
      and user_id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_subscription_billing_payment on public.transactions;
create trigger trg_sync_subscription_billing_payment
after insert on public.transactions
for each row
when (new.subscription_billing_id is not null)
execute function public.sync_subscription_billing_payment();

-- =========================================================
-- 23) Validate billing ownership before linking transaction
-- =========================================================

create or replace function public.validate_transaction_billing_ownership()
returns trigger
language plpgsql
as $$
declare
  billing_owner uuid;
begin
  if new.subscription_billing_id is null then
    return new;
  end if;

  select sb.user_id
  into billing_owner
  from public.subscription_billings sb
  where sb.id = new.subscription_billing_id;

  if billing_owner is null then
    raise exception 'Invalid subscription_billing_id: billing does not exist';
  end if;

  if billing_owner <> new.user_id then
    raise exception 'Subscription billing does not belong to the same user';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_transaction_billing_ownership on public.transactions;
create trigger trg_validate_transaction_billing_ownership
before insert or update on public.transactions
for each row
execute function public.validate_transaction_billing_ownership();

-- =========================================================
-- 24) Validate receipt ownership before linking transaction
-- =========================================================

create or replace function public.validate_transaction_receipt_ownership()
returns trigger
language plpgsql
as $$
declare
  receipt_owner uuid;
begin
  if new.receipt_import_id is null then
    return new;
  end if;

  select r.user_id
  into receipt_owner
  from public.receipt_imports r
  where r.id = new.receipt_import_id;

  if receipt_owner is null then
    raise exception 'Invalid receipt_import_id: receipt import does not exist';
  end if;

  if receipt_owner <> new.user_id then
    raise exception 'Receipt import does not belong to the same user';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_transaction_receipt_ownership on public.transactions;
create trigger trg_validate_transaction_receipt_ownership
before insert or update on public.transactions
for each row
execute function public.validate_transaction_receipt_ownership();

-- =========================================================
-- 25) Helper function: calculate next billing date
-- =========================================================

create or replace function public.calculate_next_billing_date(
  current_date_input date,
  billing_cycle_input text,
  interval_count_input integer
)
returns date
language plpgsql
as $$
begin
  if billing_cycle_input = 'weekly' then
    return current_date_input + make_interval(days => 7 * interval_count_input);
  elseif billing_cycle_input = 'monthly' then
    return current_date_input + make_interval(months => interval_count_input);
  elseif billing_cycle_input = 'quarterly' then
    return current_date_input + make_interval(months => 3 * interval_count_input);
  elseif billing_cycle_input = 'yearly' then
    return current_date_input + make_interval(years => interval_count_input);
  else
    raise exception 'Unsupported billing cycle: %', billing_cycle_input;
  end if;
end;
$$;

-- =========================================================
-- 26) Auto-create initial billing on new subscription
-- =========================================================

create or replace function public.create_initial_subscription_billing()
returns trigger
language plpgsql
as $$
begin
  if new.auto_generate_billings = true and new.deleted_at is null then
    insert into public.subscription_billings (
      subscription_id,
      user_id,
      billing_date,
      amount,
      currency,
      status,
      generated_automatically
    )
    values (
      new.id,
      new.user_id,
      new.next_billing_date,
      new.amount,
      new.currency,
      case
        when new.next_billing_date < current_date then 'due'
        else 'scheduled'
      end,
      true
    )
    on conflict (subscription_id, billing_date) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_create_initial_subscription_billing on public.subscriptions;
create trigger trg_create_initial_subscription_billing
after insert on public.subscriptions
for each row
execute function public.create_initial_subscription_billing();

-- =========================================================
-- 27) Generate next billing when one becomes paid
-- =========================================================

create or replace function public.generate_next_billing_after_payment()
returns trigger
language plpgsql
as $$
declare
  sub_record public.subscriptions%rowtype;
  next_date date;
begin
  if new.status <> 'paid' then
    return new;
  end if;

  select *
  into sub_record
  from public.subscriptions s
  where s.id = new.subscription_id;

  if sub_record.id is null then
    return new;
  end if;

  if sub_record.status <> 'active' then
    return new;
  end if;

  if sub_record.auto_generate_billings <> true then
    return new;
  end if;

  next_date := public.calculate_next_billing_date(
    new.billing_date,
    sub_record.billing_cycle,
    sub_record.interval_count
  );

  if sub_record.end_date is not null and next_date > sub_record.end_date then
    return new;
  end if;

  insert into public.subscription_billings (
    subscription_id,
    user_id,
    billing_date,
    amount,
    currency,
    status,
    generated_automatically
  )
  values (
    sub_record.id,
    sub_record.user_id,
    next_date,
    sub_record.amount,
    sub_record.currency,
    case
      when next_date < current_date then 'due'
      else 'scheduled'
    end,
    true
  )
  on conflict (subscription_id, billing_date) do nothing;

  update public.subscriptions
  set
    next_billing_date = next_date,
    updated_at = now()
  where id = sub_record.id;

  return new;
end;
$$;

drop trigger if exists trg_generate_next_billing_after_payment on public.subscription_billings;
create trigger trg_generate_next_billing_after_payment
after update on public.subscription_billings
for each row
when (old.status is distinct from new.status and new.status = 'paid')
execute function public.generate_next_billing_after_payment();

-- =========================================================
-- 28) Soft-delete friendly helper views are NOT created here
-- Keep filtering deleted_at is null in app queries
-- =========================================================