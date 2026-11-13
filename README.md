# Eearnest

**Understand Your Pay. Know Your Rights.**

Earnest helps Filipino employees understand their payslips, contracts, deductions, and workplace rights. It uses Lumen OCR to read documents, deterministic code to break down pay, and Lumen AI Chat to answer labor-rights questions in English or Filipino.

**SDGs:** 8 (primary), 10, 4, 16.

**Features:** upload payslips and contracts, extract and correct their data, see gross-to-net breakdowns with overtime and holiday estimates, ask labor-rights questions, flag entries to raise with HR, and view history and download reports.

> **Status:** all four modules work. Sign-in is not built yet. In development, data belongs to the user set in `DEV_USER_ID`.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, shadcn/ui, PDF.js, jsPDF
- **Backend:** Node.js, Express
- **Data:** Supabase (PostgreSQL, Storage, Auth)
- **AI:** Lumen OCR, Lumen AI Chat
- **Deploy:** Vercel (frontend), Render (backend), GitHub Actions

The project is JavaScript only (ES Modules) and uses npm workspaces.

## Project Structure

```
backend/src/
├── app.js                CORS, body parsing, route registration
├── config/               env.js (all settings), supabase.js (service-role client)
├── middleware/           API responses, errors, validation, userContext (who owns the data)
└── modules/
    ├── documents/        uploads, Lumen OCR, corrections
    ├── ai-assistant/     chat route; knowledge/ holds the FAQ, references, and prompt
    ├── payroll/          calculator.js (pay math), saved records
    └── dashboard/        summaries, trends, reports, tests

frontend/src/
├── App.jsx, main.jsx     app shell
├── components/           shared layout and dialogs; ui/ holds the shadcn/ui primitives
├── config/               env and Supabase client (public keys only)
├── services/apiClient.js the only way to call the backend
└── modules/<feature>/    page, components/, services/, lib/, hooks/

database/schema.sql       tables and RLS policies
test-samples/ocr/         synthetic payslips and contracts
```

Each backend module is split into `routes → controller → service → repository`, with `validators.js` for checking requests.

## Getting Started

```bash
npm install                    # run from the repo root only
cp .env.example .env           # PowerShell: Copy-Item .env.example .env
npm run dev:backend            # http://localhost:5000  (health check: /api/health)
npm run dev:frontend           # http://localhost:5173
```

Run the two dev commands in separate terminals.

Vite and Express both read the single root `.env`. Each variable is explained in `.env.example`. Key rules:

- Anything starting with `VITE_` ends up in browser code, so never put a secret there.
- `SUPABASE_SERVICE_ROLE_KEY`, `LUMEN_API_KEY`, and `LUMEN_API_SECRET` are secrets. Keep them in the backend only.
- `DEV_USER_ID` is used in development only. Documents and Payroll need it.

### Supabase

1. Create a project. Copy its URL and anon key into both the `SUPABASE_*` and `VITE_SUPABASE_*` variables.
2. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY` only.
3. Run `database/schema.sql` in the SQL editor. The backend creates the private `documents` bucket on the first upload.
4. Create a test user under **Authentication > Users** and put its id in `DEV_USER_ID`.

### Tests and build

```bash
npm run build                                                          # frontend build
cd backend;  node --test src/modules/dashboard/__tests__/dashboard.test.js
cd frontend; node --test "src/**/*.test.js"
```

Pass `node --test` a file or glob, not a bare folder. No workspace defines a `test` or `lint` script yet, so `npm test` and `npm run lint` do nothing.

## API

Every response uses one of two shapes:

```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "message": "...", "error": { "code": "ERROR_CODE", "details": null } }
```

| Prefix | Endpoints |
| --- | --- |
| `/api/health` | `GET /` |
| `/api/documents` | `GET /`, `POST /upload-url`, `GET /:id`, `POST /:id/extract`, `PATCH /:id`, `DELETE /:id` |
| `/api/ai-assistant` | `POST /chat` |
| `/api/payroll` | `POST /preview`, `GET/POST /records`, `GET/DELETE /records/:id` |
| `/api/dashboard` | `GET /summary`, `/history`, `/salary-trends`, `/analytics`, `/reports/payroll` |

`middleware/userContext.js` decides who owns the data:

- If someone is signed in, it uses `req.user.id`.
- In production with no signed-in user, it returns 401.
- In development, it falls back to `DEV_USER_ID`.

It never takes a user id from the request body or query string.

Lumen is called only from the backend. OCR lives in `documents/ocrService.js`, and chat lives in `ai-assistant/routes.js`. Chat answers basic questions from the reviewed FAQ and uses it as a fallback if Lumen is unavailable. Lumen credits are limited, so avoid unnecessary calls.

## Team and Git Workflow

| Owner | Area |
| --- | --- |
| Project Lead | Shared code, dependencies, schema, env, CI, route registration |
| Member 1 | Documents |
| Member 2 | AI Assistant |
| Member 3 | Payroll |
| Member 4 | Dashboard |

- **Your folders:** each member works only in `frontend/src/modules/<feature>/` and `backend/src/modules/<feature>/`.
- **Shared changes:** ask the lead for any change to shared files or dependencies.
- **Branches:** each member uses `feature/<feature>`. Never commit straight to `main`.
- **Pull requests:** open them against `main`. Only the lead merges.
- **CI:** runs on every pull request to `main` and every push to `main`.

## Privacy and Security

- Treat every payslip and contract as confidential. Use only synthetic documents in tests and demos.
- Store documents in private buckets with RLS, scoped to each user. Never expose permanent document URLs.
- Never log extracted text, salary figures, or personal identifiers. Send Lumen only the minimum data it needs.
- Validate every request, file type, and file size. Never expose internal error details to users.
- Label every value as **extracted** (OCR), **calculated** (code), or **AI-generated**. Payroll estimates should show their assumptions and never declare that an employer broke the law.
