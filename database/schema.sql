-- =============================================================================
-- Earnest database schema (matches the current Supabase project)
--
-- Every statement is safe to re-run: tables and indexes use IF NOT EXISTS,
-- triggers and policies are dropped (IF EXISTS) before being re-created, and
-- functions use CREATE OR REPLACE. IF NOT EXISTS skips a table that already
-- exists; it does not alter its columns.
--
-- Only the project lead changes this file and applies migrations.
-- Auth users live in auth.users (managed by Supabase).
--
-- RELATIONSHIPS
--   auth.users 1---1 profiles
--   auth.users 1---* documents
--   documents  1---* payroll_records
--   payroll_records 1---* payroll_items      (item_type: earning | deduction)
--
-- AI chat conversations and messages are NOT stored.
-- =============================================================================

-- Shared trigger function to maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.profiles (
  id          uuid not null,
  email       text,
  full_name   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users (id)
);

create table if not exists public.documents (
  id              uuid not null default gen_random_uuid(),
  user_id         uuid not null,
  document_type   text not null check (document_type = any (array['payslip'::text, 'contract'::text])),
  file_name       text not null,
  file_path       text not null,          -- path in a PRIVATE bucket; never a public URL
  file_type       text,
  file_size       bigint,
  extracted_text  text,                   -- SENSITIVE. Never log. Cleared when the user confirms the values.
  extracted_data  jsonb default '{}'::jsonb,
  status          text not null default 'uploaded'::text
                    check (status = any (array['uploaded'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  error_message   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  constraint documents_pkey primary key (id),
  constraint documents_user_id_fkey foreign key (user_id) references auth.users (id)
);

create table if not exists public.payroll_records (
  id                 uuid not null default gen_random_uuid(),
  user_id            uuid not null,
  document_id        uuid,
  employer_name      text,
  pay_period_start   date,
  pay_period_end     date,
  payment_date       date,
  basic_salary       numeric default 0,
  total_allowances   numeric default 0,
  total_deductions   numeric default 0,
  gross_pay          numeric default 0,
  net_pay            numeric default 0,
  currency           text not null default 'PHP'::text,
  analysis_status    text not null default 'pending'::text
                       check (analysis_status = any (array['pending'::text, 'completed'::text, 'needs_review'::text])),
  discrepancy_flags  jsonb default '[]'::jsonb,
  ai_explanation     text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  constraint payroll_records_pkey primary key (id),
  constraint payroll_records_user_id_fkey foreign key (user_id) references auth.users (id),
  constraint payroll_records_document_id_fkey foreign key (document_id) references public.documents (id)
);

create table if not exists public.payroll_items (
  id                 uuid not null default gen_random_uuid(),
  payroll_record_id  uuid not null,
  item_type          text not null check (item_type = any (array['earning'::text, 'deduction'::text])),
  category           text,
  description        text not null,
  amount             numeric not null default 0,
  created_at         timestamptz default now(),
  constraint payroll_items_pkey primary key (id),
  constraint payroll_items_payroll_record_id_fkey foreign key (payroll_record_id) references public.payroll_records (id)
);

-- Indexes
create index if not exists documents_user_created_idx          on public.documents (user_id, created_at desc);
create index if not exists payroll_records_user_created_idx    on public.payroll_records (user_id, created_at);
create index if not exists payroll_records_document_id_idx     on public.payroll_records (document_id);
create index if not exists payroll_items_record_idx            on public.payroll_items (payroll_record_id);

-- No duplicate records (the backend checks first; these are the safety net).
--   * the same file (type + name + size) cannot be uploaded twice by one user; failed uploads do not count
--   * one payroll breakdown per uploaded document
--   * one payroll breakdown per employer and pay period for a user
create unique index if not exists documents_unique_upload_idx
  on public.documents (user_id, document_type, file_name, file_size)
  where status <> 'failed';
create unique index if not exists payroll_records_unique_document_idx
  on public.payroll_records (document_id)
  where document_id is not null;
create unique index if not exists payroll_records_unique_period_idx
  on public.payroll_records (user_id, lower(coalesce(employer_name, '')), pay_period_start, pay_period_end)
  where pay_period_start is not null and pay_period_end is not null;

-- updated_at triggers (dropped first because triggers have no IF NOT EXISTS)
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists documents_updated_at on public.documents;
create trigger documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

drop trigger if exists payroll_records_updated_at on public.payroll_records;
create trigger payroll_records_updated_at before update on public.payroll_records
  for each row execute function public.set_updated_at();

-- Create a profile row whenever someone signs up (profiles.id references auth.users).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY: a signed-in user can only touch their own rows.
-- The backend service-role key bypasses RLS, so backend code must still filter
-- by the authenticated user's id. There are no "anon" policies.
-- -----------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.documents       enable row level security;
alter table public.payroll_records enable row level security;
alter table public.payroll_items   enable row level security;

drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles
  for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists documents_own on public.documents;
create policy documents_own on public.documents
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists payroll_records_own on public.payroll_records;
create policy payroll_records_own on public.payroll_records
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists payroll_items_own on public.payroll_items;
create policy payroll_items_own on public.payroll_items
  for all to authenticated
  using (exists (select 1 from public.payroll_records r where r.id = payroll_record_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.payroll_records r where r.id = payroll_record_id and r.user_id = auth.uid()));

-- STORAGE: bucket "documents" must be private (public = false), with path
--   <user_id>/<document_id>/<sanitized_filename>, served by short-lived signed URLs.
--   The backend creates the bucket on first upload.
