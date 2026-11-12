# SahodSuri

**Understand Your Pay. Know Your Rights.**

## Project Overview

SahodSuri is an AI-powered document intelligence platform that helps Filipino employees understand their payslips, employment contracts, salary deductions, compensation, and workplace rights. Using Lumen OCR and Lumen AI Chat, it turns complicated employment documents into understandable explanations, transparent payroll breakdowns, and accessible information about Philippine labor rights.

**SDGs:** Primary SDG 8 (Decent Work and Economic Growth). Secondary SDG 10, SDG 4, and SDG 16.

### Problem Statement

Many Filipino employees, particularly minimum-wage workers, contractual employees, and first-time employees, struggle to understand their payslips, deductions, overtime compensation, and employment contracts. Some do not know whether their salary breakdown is correct, what specific deductions mean, or what employment terms need clarification. This makes them vulnerable to misunderstandings about their compensation and rights.

### Proposed Solution

A web application where employees can:

- Upload payslips and employment contracts.
- Extract document information using Lumen OCR.
- Understand salary components, deductions, allowances, and net pay.
- Calculate estimated overtime and holiday compensation.
- Understand employment contract terms.
- Ask general Philippine labor rights questions using Lumen AI Chat.
- Identify payroll entries that may need clarification with HR.
- View previous analyses and download reports.

> **Status:** project foundation only. Feature modules are not implemented yet.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, JavaScript (ES Modules), HTML5, CSS3, Tailwind CSS, shadcn/ui, Vite, PDF.js, jsPDF |
| Backend | Node.js, Express.js, JavaScript (ES Modules) |
| Database and services | Supabase PostgreSQL, Supabase Auth, Supabase Storage |
| AI | Lumen OCR, Lumen AI Chat |
| Deployment and tooling | Vercel (frontend), Render (backend), GitHub, GitHub Actions, Kiro IDE |

JavaScript only. No TypeScript (`.ts`/`.tsx`) and no Python. Package manager: npm with workspaces.

## Project Structure

```
.
├── .github/workflows/ci.yml
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        shared components (lead)
│   │   ├── config/            env + Supabase config (lead)
│   │   ├── services/          shared API client (lead)
│   │   ├── modules/
│   │   │   ├── documents/     Member 1
│   │   │   ├── ai-assistant/  Member 2
│   │   │   ├── payroll/       Member 3
│   │   │   └── dashboard/     Member 4
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── components.json        shadcn/ui (JavaScript) config
│   ├── index.html
│   ├── jsconfig.json
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/            env + Supabase client (lead)
│   │   ├── middleware/        responses, errors, validation (lead)
│   │   ├── modules/
│   │   │   ├── documents/     Member 1
│   │   │   ├── ai-assistant/  Member 2
│   │   │   ├── payroll/       Member 3
│   │   │   └── dashboard/     Member 4
│   │   └── app.js
│   ├── server.js
│   └── package.json
├── database/schema.sql        PROPOSED schema (not applied)
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Installation

```bash
git clone YOUR_PUBLIC_REPOSITORY_URL
cd sahodsuri
npm install
```

Run `npm install` only from the repository root. Only the project lead adds or changes dependencies.

## Environment Setup

1. Copy the template: `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`).
2. Fill in the values you have. A single root `.env` is read by both Vite and Express.
3. Never commit `.env`. It is git-ignored.

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Private (backend) | Runtime mode |
| `PORT` | Private (backend) | API port (default 5000) |
| `FRONTEND_URL` | Private (backend) | Allowed CORS origin (comma-separate multiple) |
| `VITE_API_BASE_URL` | **Public** | API base URL used by the browser |
| `VITE_SUPABASE_URL` | **Public** | Supabase project URL for the browser |
| `VITE_SUPABASE_ANON_KEY` | **Public** | Supabase anon/publishable key for the browser |
| `SUPABASE_URL` | Private (backend) | Supabase project URL |
| `SUPABASE_ANON_KEY` | Private (backend) | Supabase anon key (backend copy) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Private, secret** | Bypasses RLS. Backend only |
| `LUMEN_API_KEY` | **Private, secret** | Sent as `lumen-api-key` header |
| `LUMEN_API_SECRET` | **Private, secret** | Sent as `lumen-api-secret` header |
| `LUMEN_OCR_ENDPOINT` | Private (backend) | From official docs only |
| `LUMEN_CHAT_ENDPOINT` | Private (backend) | From official docs only |

Anything prefixed `VITE_` is bundled into browser code. Never put a secret in a `VITE_` variable.

## Development Startup

Terminal 1:

```bash
npm run dev:backend
```

Terminal 2:

```bash
npm run dev:frontend
```

### Local Development URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

Other scripts: `npm run build` (frontend build), `npm run lint`, `npm run test` (run only where defined).

### Shared API response format

```json
{ "success": true, "message": "Request completed successfully", "data": {} }
```

```json
{ "success": false, "message": "An error occurred", "error": { "code": "ERROR_CODE", "details": null } }
```

Backend helpers live in `backend/src/middleware/apiResponse.js` (`sendSuccess`, `AppError`). Frontend modules must call the backend only through `frontend/src/services/apiClient.js` (`api.get`, `api.post`, `api.postForm`, ...). Do not write your own `fetch` logic.

Planned route prefixes (registered by the lead in `backend/src/app.js`): `/api/documents`, `/api/ai-assistant`, `/api/payroll`, `/api/dashboard`.

## Supabase Setup

1. Create a project at https://supabase.com.
2. Open **Project Settings > API** and copy the **Project URL**, the **anon/publishable key**, and the **service_role key**.
3. Put the URL and anon key in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY`.
4. Put the service_role key only in `SUPABASE_SERVICE_ROLE_KEY`. Never in browser code, never committed.
5. Do **not** run `database/schema.sql` yet. It is a proposal awaiting project lead approval. Enable Row Level Security and create a **private** storage bucket before storing any real data.

The backend client is `backend/src/config/supabase.js` (lazy, service role). The browser client is `frontend/src/config/supabase.js` (public keys only). No authentication flows are implemented yet.

## Lumen Integration

Lumen OCR and Lumen AI Chat will be integrated **through the backend only**, after the official OVERCLOCK 2026 Lumen documentation has been reviewed. Endpoints and request formats are intentionally not defined yet and must not be guessed. Credentials stay server-side and are sent with the `lumen-api-key` and `lumen-api-secret` headers. Credits are limited, so avoid unnecessary calls.

## Team Ownership

| Owner | Responsibility | Exclusive folders |
| --- | --- | --- |
| Project Lead | Shared infrastructure, integration, dependencies, schema, env, CI, docs, route registration | Everything outside the module folders (root files, `frontend/src/{App.jsx,main.jsx,index.css,components,config,services}`, `backend/{server.js,src/app.js,src/config,src/middleware}`, `database/`, `.github/`) |
| Member 1: Documents | Uploads, PDF/image handling, OCR within the contract, previews, metadata, deletion | `frontend/src/modules/documents/`, `backend/src/modules/documents/` |
| Member 2: AI Assistant | Lumen Chat, payslip/contract explanations, labor rights Q&A (Filipino and English), document-grounded answers, verification indicators | `frontend/src/modules/ai-assistant/`, `backend/src/modules/ai-assistant/` |
| Member 3: Payroll | Salary breakdown, gross/net, allowances, deductions, overtime, holiday and night differential, discrepancy flags | `frontend/src/modules/payroll/`, `backend/src/modules/payroll/` |
| Member 4: Dashboard | Dashboard, history, payroll summaries, downloadable reports, statistics | `frontend/src/modules/dashboard/`, `backend/src/modules/dashboard/` |

Rules: work only inside your module folders; never edit another module or any shared file; never install dependencies or change schemas or env files yourself; follow the documented API contracts; ask the lead for shared-file changes.

## Git Workflow

- Branches: `main`, `feature/documents`, `feature/ai-assistant`, `feature/payroll`, `feature/dashboard`.
- Never commit directly to `main`.
- Each member works on their assigned feature branch and commits only their module files.
- Update your branch from the latest `main` before continuing. Never merge another member's branch into yours.
- Every pull request targets `main`. Only the project lead reviews and merges.
- Use small, focused commits with descriptive messages.
- CI (`.github/workflows/ci.yml`) runs on pull requests to `main` and pushes to `main`.

## Privacy and Security

SahodSuri handles sensitive employment and payroll information.

- Treat all payslips and contracts as confidential. Never commit real documents or personal data. Use synthetic documents for tests and demos.
- Use private Supabase Storage buckets, per-user access, and Row Level Security. Never expose permanent document URLs.
- Never log full extracted text, salary figures, or personal identifiers.
- Users must be able to delete their documents. Send the minimum personal data to Lumen.
- Keep Lumen and Supabase service-role credentials on the backend only. Never hardcode secrets.
- Validate file types, file sizes, and all requests. Do not expose internal error details.
- Be transparent: label information as **extracted** (OCR), **calculated** (deterministic JavaScript), or **AI-generated** (Lumen Chat). Never present AI output as verified payroll fact. Let users review and correct extracted values.
- Payroll estimates must use deterministic code grounded in official Philippine labor rules (DOLE), show formulas and assumptions, flag missing inputs, and never declare an employer in violation.
