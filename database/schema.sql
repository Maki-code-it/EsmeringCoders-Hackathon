-- =============================================================================
-- SahodSuri database schema (matches the current Supabase project)
--
-- Every statement is safe to re-run: tables and indexes use IF NOT EXISTS,
-- triggers are dropped (IF EXISTS) before being re-created, and the function
-- uses CREATE OR REPLACE. IF NOT EXISTS skips a table that already exists; it
-- does not alter its columns.
--
-- Only the project lead changes this file and applies migrations.
-- Auth users live in auth.users (managed by Supabase).
--
-- RELATIONSHIPS
--   auth.users 1---1 profiles
--   auth.users 1---* documents
--   documents  1---* payroll_records
--   payroll_records 1---* payroll_items      (item_type: earning | deduction)
--   documents  1---* contract_reviews
--   auth.users 1---* chat_conversations 1---* chat_messages
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
  extracted_text  text,                   -- SENSITIVE. Never log.
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

create table if not exists public.contract_reviews (
  id            uuid not null default gen_random_uuid(),
  user_id       uuid not null,
  document_id   uuid not null,
  summary       text,
  findings      jsonb default '[]'::jsonb,
  language      text default 'English'::text,
  review_status text not null default 'pending'::text
                  check (review_status = any (array['pending'::text, 'completed'::text, 'failed'::text])),
  created_at    timestamptz default now(),
  constraint contract_reviews_pkey primary key (id),
  constraint contract_reviews_user_id_fkey foreign key (user_id) references auth.users (id),
  constraint contract_reviews_document_id_fkey foreign key (document_id) references public.documents (id)
);

create table if not exists public.chat_conversations (
  id          uuid not null default gen_random_uuid(),
  user_id     uuid not null,
  title       text default 'New Conversation'::text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint chat_conversations_pkey primary key (id),
  constraint chat_conversations_user_id_fkey foreign key (user_id) references auth.users (id)
);

create table if not exists public.chat_messages (
  id               uuid not null default gen_random_uuid(),
  conversation_id  uuid not null,
  role             text not null check (role = any (array['user'::text, 'assistant'::text])),
  content          text not null,
  created_at       timestamptz default now(),
  constraint chat_messages_pkey primary key (id),
  constraint chat_messages_conversation_id_fkey foreign key (conversation_id) references public.chat_conversations (id)
);

-- Indexes
create index if not exists documents_user_created_idx          on public.documents (user_id, created_at desc);
create index if not exists payroll_records_user_created_idx    on public.payroll_records (user_id, created_at);
create index if not exists payroll_records_document_id_idx     on public.payroll_records (document_id);
create index if not exists payroll_items_record_idx            on public.payroll_items (payroll_record_id);
create index if not exists contract_reviews_user_created_idx   on public.contract_reviews (user_id, created_at desc);
create index if not exists contract_reviews_document_id_idx    on public.contract_reviews (document_id);
create index if not exists chat_conversations_user_idx         on public.chat_conversations (user_id, updated_at desc);
create index if not exists chat_messages_conversation_idx      on public.chat_messages (conversation_id, created_at);

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

drop trigger if exists chat_conversations_updated_at on public.chat_conversations;
create trigger chat_conversations_updated_at before update on public.chat_conversations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY REQUIREMENTS (enable BEFORE any real data is stored)
--   alter table <each table> enable row level security;
--   profiles, documents, payroll_records, contract_reviews, chat_conversations:
--     authenticated users may access only rows where user_id (profiles: id) = auth.uid()
--   payroll_items: via parent payroll_records.user_id = auth.uid()
--   chat_messages: via parent chat_conversations.user_id = auth.uid()
--   No "anon" policies. The backend service-role key bypasses RLS, so backend
--   code must always filter by the authenticated user's id.
--
-- STORAGE: bucket "documents" must be private (public = false), with path
--   <user_id>/<document_id>/<sanitized_filename>, served by short-lived signed URLs.
-- -----------------------------------------------------------------------------
