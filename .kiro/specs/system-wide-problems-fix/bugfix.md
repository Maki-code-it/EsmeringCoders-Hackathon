# Bugfix Requirements Document

## Introduction

SahodSuri (Node/Express backend, React + Vite frontend, Supabase schema) has a set of defects across tooling, security, error handling, configuration and data handling. The request is to fix all problems in the system. The first four defects were reported by the user. The rest were found by reading the code. Each defect is a separate bug condition, grouped by area. The impact ranges from CI that silently verifies nothing, to data exposure when sign-in is absent, to OCR that cannot read amounts that start with the peso sign.

## Bug Analysis

### Current Behavior (Defect)

**Tooling, tests and build (reported)**

1.1 WHEN `npm test` or `npm run lint` runs from the repository root or in CI THEN the system runs nothing, because neither `backend/package.json` nor `frontend/package.json` defines a `test` or `lint` script, so CI reports success without verifying anything
1.2 WHEN the existing tests are run with `node --test <directory>` (for example `frontend/src/modules/dashboard/__tests__` or `backend/src/modules/dashboard/__tests__`) THEN the system fails with `MODULE_NOT_FOUND`, because Node treats the directory as a module path instead of discovering the `*.test.js` files
1.3 WHEN the documents, payroll or ai-assistant modules change THEN the system has no automated tests to catch regressions, including the payroll calculator, the document validators and the AI fallback logic
1.4 WHEN the frontend is built THEN the system emits a main bundle of about 793 kB (`index-*.js`) because all pages load eagerly, with no route-level code splitting

**Authentication and data exposure**

1.5 WHEN the app runs with `NODE_ENV=production` THEN the system returns 401 for every documents, payroll records and dashboard request, because nothing in the backend sets `req.user`, so no real user can use the app
1.6 WHEN the app runs outside production and `DEV_USER_ID` is not set THEN the dashboard queries run with no `user_id` filter and return every user's payroll records, documents and deduction lines
1.7 WHEN the dashboard resolves the current user THEN the system reads `process.env.NODE_ENV` and `process.env.DEV_USER_ID` directly instead of the shared `env` config, which can disagree with the documents and payroll modules
1.8 WHEN a client sends `sessionId` to `POST /api/ai-assistant/chat` THEN the system forwards it to Lumen without checking that the session belongs to the caller, and the endpoint has no authentication or rate limiting
1.9 WHEN anyone calls `POST /api/payroll/preview` or `POST /api/ai-assistant/chat` THEN the system has no rate limiting, so the endpoint can be abused and can burn Lumen API credits

**Documents and OCR**

1.10 WHEN OCR text contains an amount prefixed with the peso sign (for example `Basic Pay: ₱20,000.00`) THEN the system extracts 0, because the amount regexes in `ocrService.js` contain a corrupted character sequence (`Ã¢â€šÂ±`) in place of `₱`
1.11 WHEN `POST /api/documents/upload-url` omits `file_type` or `file_size` THEN the system accepts the request, skipping the MIME and 10 MB checks and the duplicate-file check
1.12 WHEN the document UUID is validated THEN the system accepts only UUID versions 1 to 5 in documents but any version in payroll, so the two modules validate the same id differently
1.13 WHEN the Supabase browser client is not configured THEN `uploadAndExtractDocument` silently skips the storage upload and continues to OCR, which then fails with `STORAGE_FILE_MISSING` and leaves a document row stuck in `uploaded` or `failed`
1.14 WHEN signed-URL creation succeeds but the later metadata insert fails, or the server stops during OCR THEN the system leaves orphaned storage targets or a document stuck in `processing` with no way to recover
1.15 WHEN a document is deleted and the storage removal fails THEN the system ignores the error, deletes the database row anyway, and leaves a sensitive file in the bucket
1.16 WHEN the user saves corrections to a document THEN the system keeps `extracted_text`, although the schema comment says it is cleared once the user confirms the values

**Payroll data integrity**

1.17 WHEN a payroll record is created or deleted THEN the system writes `payroll_records` and `payroll_items` in separate calls with no transaction, so a failure between the calls can leave an orphan record or orphan items, and `payroll_items` has no cascade delete
1.18 WHEN two requests save the same payslip at the same moment THEN the duplicate check (`findDuplicate`) can pass for both, and the second insert fails on a unique index and returns a generic 502 instead of a 409

**Configuration and naming mismatches**

1.19 WHEN a developer copies `.env.example` THEN the system lacks entries for variables the code reads (`DEV_USER_ID`, `LUMEN_CHAT_ORIGIN`, `LUMEN_INSTANCE_ID`, `VITE_APIM_ORIGIN`), and the listed `LUMEN_CHAT_ENDPOINT` is never read, so AI chat reports "not configured" even when the documented variables are filled in
1.20 WHEN the app is shown or described THEN the system uses the name "Earnest" (page title, API messages, prompts, schema header, console log) while the README and product name are "SahodSuri"
1.21 WHEN a developer reads the README THEN it still says "project foundation only. Feature modules are not implemented yet" and describes the schema as "PROPOSED (not applied)", although the modules are implemented and the schema is applied

### Expected Behavior (Correct)

2.1 WHEN `npm test` or `npm run lint` runs from the root or in CI THEN the system SHALL run real `test` and `lint` scripts defined in the backend and frontend packages, and SHALL fail the CI job when a test or lint check fails
2.2 WHEN the existing tests are run through the package `test` scripts THEN the system SHALL discover the `*.test.js` files by glob (not by directory path) and SHALL run them without `MODULE_NOT_FOUND`
2.3 WHEN the documents, payroll or ai-assistant modules change THEN the system SHALL have automated tests covering the payroll calculator and validators, the document validators and OCR field parsing, and the AI validation and FAQ fallback path, all runnable without network or Supabase access
2.4 WHEN the frontend is built THEN the system SHALL split the code by page (lazy-loaded routes) and load the PDF export code on demand, so the main entry chunk is well below the current 793 kB
2.5 WHEN the app runs with `NODE_ENV=production` THEN the system SHALL authenticate the caller (verify the Supabase access token sent in the `Authorization` header), set `req.user`, and serve the caller's own data, and SHALL return 401 only when the token is missing or invalid
2.6 WHEN the app runs outside production and `DEV_USER_ID` is not set THEN the dashboard SHALL refuse with the same 503 `DEV_USER_NOT_CONFIGURED` error as the other modules and SHALL NOT run unscoped queries
2.7 WHEN the dashboard resolves the current user THEN the system SHALL use the shared `env` config and the same user-resolution behavior as the documents and payroll modules
2.8 WHEN a client calls `POST /api/ai-assistant/chat` THEN the system SHALL not trust a client-supplied `sessionId` for another user's session (bind sessions to the caller, or ignore a session the caller did not open) and SHALL apply a per-client rate limit
2.9 WHEN anyone calls `POST /api/payroll/preview` or `POST /api/ai-assistant/chat` THEN the system SHALL apply a rate limit and SHALL respond with 429 and the standard error format when it is exceeded
2.10 WHEN OCR text contains an amount prefixed with the peso sign THEN the system SHALL extract the correct amount, with the regexes using a proper `₱` (and `PHP`) prefix
2.11 WHEN `POST /api/documents/upload-url` omits `file_type` or `file_size` THEN the system SHALL reject the request with a 400 validation error
2.12 WHEN a document or payroll id is validated THEN the system SHALL use one shared UUID validator in both modules
2.13 WHEN the Supabase browser client is not configured or the storage upload fails THEN the system SHALL stop before OCR, show a clear error, and mark or remove the pending document row
2.14 WHEN a metadata insert fails after the upload target was created, or a document has been in `processing` longer than the OCR timeout THEN the system SHALL clean up the orphaned target and SHALL allow the stuck document to be re-extracted
2.15 WHEN a document is deleted and the storage removal fails THEN the system SHALL keep the database row and return an error so the file is not orphaned
2.16 WHEN the user saves corrections to a document THEN the system SHALL clear `extracted_text`, as documented in the schema
2.17 WHEN a payroll record is created or deleted THEN the system SHALL write the record and its items atomically (a database function or `on delete cascade`), leaving no orphan rows on failure
2.18 WHEN a unique-index violation occurs while saving a payroll record or document THEN the system SHALL return 409 `DUPLICATE_PAYROLL_RECORD` or `DUPLICATE_DOCUMENT` instead of a generic 502
2.19 WHEN a developer copies `.env.example` THEN the system SHALL list every variable the code reads, remove or wire up the unused `LUMEN_CHAT_ENDPOINT`, and document each variable
2.20 WHEN the app is shown or described THEN the system SHALL use one product name, "SahodSuri", in the page title, API messages, prompts, schema header and logs
2.21 WHEN a developer reads the README THEN it SHALL describe the current implementation status and the applied schema accurately

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a signed-in user (or the configured `DEV_USER_ID` outside production) requests their own documents, payroll records or dashboard data THEN the system SHALL CONTINUE TO return only that user's rows in the existing response format
3.2 WHEN a valid payslip body is sent to `POST /api/payroll/preview` or `POST /api/payroll/records` THEN the system SHALL CONTINUE TO compute gross, deductions, net pay, flags and percentages in whole centavos exactly as the calculator does today
3.3 WHEN a valid document is uploaded THEN the system SHALL CONTINUE TO create the private-bucket path `<user_id>/<document_id>/<sanitized_filename>`, return a signed upload target, and run OCR through the Lumen flow (upload, poll, read pages)
3.4 WHEN OCR text uses amounts without the peso sign (for example `Basic Pay: 20,000.00` or `PHP 20,000.00`) THEN the system SHALL CONTINUE TO parse them as before
3.5 WHEN the same payslip is saved twice sequentially THEN the system SHALL CONTINUE TO return 409 for the duplicate
3.6 WHEN Lumen answers normally THEN the system SHALL CONTINUE TO return the Lumen answer with cautions and references, and WHEN Lumen declines or is unavailable and a reviewed FAQ entry exists THEN the system SHALL CONTINUE TO return the FAQ answer with the notice
3.7 WHEN the API returns any success or error THEN the system SHALL CONTINUE TO use the `{ success, message, data }` and `{ success: false, message, error: { code, details } }` contract, and SHALL NOT expose stack traces or Supabase error text
3.8 WHEN the dashboard is loaded with a valid range, history paging or report request THEN the system SHALL CONTINUE TO return the same summary, trend, analytics, history and CSV/PDF report content
3.9 WHEN the frontend is used after the build changes THEN every page (Dashboard, Upload Payslip, Payroll Breakdown, AI Assistant), hash navigation and the PDF/CSV export SHALL CONTINUE TO work
3.10 WHEN the existing dashboard tests (backend and frontend) run THEN they SHALL CONTINUE TO pass
3.11 WHEN CI runs `npm ci`, lint, test and build with no secrets THEN the build SHALL CONTINUE TO succeed without any environment variables set
