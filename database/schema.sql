-- =============================================================================
-- SahodSuri PROPOSED database schema (REFERENCE ONLY)
--
-- STATUS: DRAFT. Not approved. Do NOT execute, apply as a migration, or use to
-- create production tables until the project lead has reviewed and approved it.
--
-- Target: Supabase PostgreSQL. Auth users live in auth.users (managed by Supabase).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- OWNERSHIP MODEL
-- Every user-owned row carries user_id -> auth.users(id), directly or through a
-- parent row. A user may only read/write their own rows. Only the project lead
-- changes this file and applies migrations.
--
-- RELATIONSHIPS
--   auth.users 1---1 profiles
--   auth.users 1---* documents
--   documents  1---* document_analyses
--   documents  1---* payroll_records          (a payslip document -> payroll record)
--   payroll_records 1---* payroll_deductions
--   auth.users 1---* analysis_history ; documents 1---* analysis_history
-- -----------------------------------------------------------------------------

-- Shared trigger to maintain updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- profiles: PK id (= auth.users.id)
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- documents: PK id; FK user_id
create table documents (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  document_type      text not null check (document_type in ('payslip', 'contract')),
  original_filename  text not null,
  storage_path       text not null,           -- path in a PRIVATE bucket; never a public URL
  mime_type          text not null,
  file_size          bigint not null check (file_size > 0),
  upload_status      text not null default 'pending'
                       check (upload_status in ('pending', 'uploaded', 'processing', 'processed', 'failed')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index documents_user_id_idx         on documents (user_id);
create index documents_user_created_idx    on documents (user_id, created_at desc);
create unique index documents_storage_path_uidx on documents (storage_path);

-- document_analyses: PK id; FK document_id, user_id
-- Holds OCR output and AI explanation. Keep these separate from calculated payroll
-- figures (payroll_records) to avoid duplicating extracted values.
create table document_analyses (
  id                   uuid primary key default gen_random_uuid(),
  document_id          uuid not null references documents (id) on delete cascade,
  user_id              uuid not null references auth.users (id) on delete cascade,
  extracted_text       text,                  -- SENSITIVE. Never log. See open decisions.
  analysis_result      jsonb,                 -- structured, labelled: extracted / calculated / ai_generated
  verification_status  text not null default 'unverified'
                         check (verification_status in ('unverified', 'user_corrected', 'user_confirmed')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index document_analyses_document_id_idx on document_analyses (document_id);
create index document_analyses_user_id_idx     on document_analyses (user_id);

-- payroll_records: PK id; FK user_id, document_id
-- Stores user-confirmed/corrected payslip figures only.
create table payroll_records (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  document_id        uuid references documents (id) on delete set null,
  pay_period_start   date,
  pay_period_end     date,
  basic_salary       numeric(12, 2),
  gross_pay          numeric(12, 2),
  total_deductions   numeric(12, 2),
  net_pay            numeric(12, 2),
  currency           char(3) not null default 'PHP',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (pay_period_end is null or pay_period_start is null or pay_period_end >= pay_period_start)
);
create index payroll_records_user_id_idx     on payroll_records (user_id);
create index payroll_records_document_id_idx on payroll_records (document_id);
create index payroll_records_user_period_idx on payroll_records (user_id, pay_period_end desc);

-- payroll_deductions: PK id; FK payroll_record_id (ownership via parent)
create table payroll_deductions (
  id                 uuid primary key default gen_random_uuid(),
  payroll_record_id  uuid not null references payroll_records (id) on delete cascade,
  deduction_name     text not null,
  amount             numeric(12, 2) not null check (amount >= 0),
  description        text,
  created_at         timestamptz not null default now()
);
create index payroll_deductions_record_idx on payroll_deductions (payroll_record_id);

-- analysis_history: PK id; FK user_id, document_id
create table analysis_history (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  document_id       uuid references documents (id) on delete set null,
  analysis_type     text not null,           -- e.g. 'ocr', 'payroll_breakdown', 'contract_explanation'
  result_reference  uuid,                    -- id of the related row (see open decisions)
  created_at        timestamptz not null default now()
);
create index analysis_history_user_created_idx on analysis_history (user_id, created_at desc);
create index analysis_history_document_id_idx  on analysis_history (document_id);

-- updated_at triggers
create trigger profiles_updated_at          before update on profiles          for each row execute function set_updated_at();
create trigger documents_updated_at         before update on documents         for each row execute function set_updated_at();
create trigger document_analyses_updated_at before update on document_analyses for each row execute function set_updated_at();
create trigger payroll_records_updated_at   before update on payroll_records   for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY REQUIREMENTS (must be enabled BEFORE any real data is stored)
--
--   alter table <each table> enable row level security;
--
-- Policies (draft, per role "authenticated"):
--   profiles            select/insert/update where id = auth.uid()
--   documents           select/insert/update/delete where user_id = auth.uid()
--   document_analyses   select/insert/update/delete where user_id = auth.uid()
--   payroll_records     select/insert/update/delete where user_id = auth.uid()
--   payroll_deductions  all operations where exists (
--                         select 1 from payroll_records r
--                         where r.id = payroll_record_id and r.user_id = auth.uid())
--   analysis_history    select/insert/delete where user_id = auth.uid()
--
-- No "anon" policies. The backend service-role key bypasses RLS, so backend code
-- must always filter by the authenticated user's id.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- STORAGE REQUIREMENTS (private document storage)
--   * Bucket "documents": public = false.
--   * Object path convention: <user_id>/<document_id>/<sanitized_filename>
--   * Storage policies: authenticated users may select/insert/delete only objects
--     whose first folder segment equals auth.uid()::text.
--   * Serve files only via short-lived signed URLs created by the backend; never
--     store or expose permanent URLs.
--   * Enforce allowed MIME types (PDF, PNG, JPEG) and a maximum file size in the
--     backend and in bucket settings.
--   * Deleting a document must delete the storage object and dependent rows.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- UNRESOLVED SCHEMA DECISIONS (project lead to decide)
--   1. Retain extracted_text at all? Option: store only structured fields and
--      discard raw OCR text after review to minimize sensitive data.
--   2. analysis_history.result_reference: polymorphic uuid vs. separate nullable
--      FKs (document_analysis_id, payroll_record_id) for referential integrity.
--   3. Should analysis_history be merged into document_analyses? Overlap risk.
--   4. Add payroll_records.source ('extracted' | 'user_corrected') or rely on
--      document_analyses.verification_status?
--   5. Store allowances / earnings as a payroll_earnings table (symmetrical to
--      payroll_deductions) for allowance categorization and overtime lines.
--   6. Add a deduction category (e.g. SSS, PhilHealth, Pag-IBIG, tax, other).
--   7. documents.document_type values and contract-specific fields.
--   8. Retention period and user-initiated account/data deletion policy.
--   9. Encryption of extracted_text/analysis_result at rest beyond Supabase defaults.
--  10. Audit logging without storing salary or personal identifiers.
--  11. Auto-create profiles row via auth trigger vs. on first login.
-- -----------------------------------------------------------------------------
