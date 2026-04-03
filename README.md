# WorkPulse (PunaIme) - Technical README and Audit Record

This repository contains a job application web platform with:
- A static frontend (`index.html`, `apply.html`, `signin.html`, `admin.html`)
- A Node.js/Express backend (`backend/server.js`)
- A file-based SQLite database managed through `sql.js` (`backend/punaime.db`)

This README is intentionally evidence-based and audit-oriented.

## 1) Audit Metadata

| Field | Value |
|---|---|
| Audit date | 2026-02-13 |
| Repository state during audit | Clean working tree on `main` |
| Audit scope | All first-party tracked source/config files (HTML, CSS, JS, SQL, package metadata), plus runtime/API behavior and dependency audit |
| Excluded from deep code review | `backend/node_modules`, binary assets (`*.png`, `*.docx`, `*.db` internals except schema/count checks) |
| Runtime environment used | Node `v22.13.1`, npm `10.9.2` |
| Verification performed | Static code inspection, endpoint smoke tests, schema/data checks, `npm audit`, JS syntax check |

## 2) Repository Inventory

Top-level tracked files/directories:

```text
.gitignore
admin.html
apply.html
index.html
signin.html
script/
styles/
backend/
LOGO-PunaIme.png
Zhvillimi i Web Aplikacionit per Aplikim per pune.docx
```

Backend tracked files:

```text
backend/add_jobs.sql
backend/database.js
backend/init-db.js
backend/package-lock.json
backend/package.json
backend/punaime.db
backend/schema.sql
backend/server.js
```

First-party source/config size snapshot (excluding lockfile):
- Approximate first-party LOC: `4760` lines
- No automated test files detected (`*.test.*`, `*.spec.*`)

## 3) System Architecture

```text
Browser (static pages)
  -> fetch() calls to http://localhost:3000/api/*
  -> localStorage key: punaime_user

Express server (backend/server.js)
  -> serves static files from repo root
  -> exposes REST endpoints under /api/*
  -> uses sql.js wrapper (backend/database.js)
  -> persists to backend/punaime.db
  -> sends email via nodemailer (Gmail) when /api/apply is called
```

Implementation evidence:
- Static serving: `backend/server.js:35`
- CORS enabled globally: `backend/server.js:32`
- Fixed port: `backend/server.js:11`
- API base URL hardcoded in frontend: `script/config.js:2`

## 4) Technology Stack

Backend:
- Node.js (ES modules enabled via `"type": "module"` in `backend/package.json`)
- Express
- `sql.js` for SQLite in-memory runtime with file persistence
- `nodemailer` for email notifications
- `cors`, `body-parser`

Frontend:
- Plain HTML/CSS/vanilla JavaScript
- No frontend build system
- No framework or bundler

Database:
- SQLite file `backend/punaime.db` used by runtime
- Additional SQL files contain MySQL-style DDL/DML (`backend/schema.sql`, `backend/add_jobs.sql`)

## 5) How to Run Locally

### Prerequisites
- Node.js 18+ (audit performed with Node 22)

### Install and initialize backend

```bash
cd backend
npm install
npm run setup-db
npm start
```

### Access application
- Main page: `http://localhost:3000/index.html`
- Jobs page: `http://localhost:3000/apply.html`
- Sign-in page: `http://localhost:3000/signin.html`
- Admin page: `http://localhost:3000/admin.html`

## 6) Environment Variables

The backend reads `backend/.env` manually at startup (`backend/server.js`).

Expected keys:

| Variable | Purpose |
|---|---|
| `EMAIL_USER` | SMTP/Gmail sender account |
| `EMAIL_PASS` | SMTP/Gmail app password |
| `ADMIN_EMAIL` | Recipient for admin notifications |
| `DB_HOST` | Present in local `.env`, not used by current runtime |
| `DB_USER` | Present in local `.env`, not used by current runtime |
| `DB_PASS` | Present in local `.env`, not used by current runtime |
| `DB_NAME` | Present in local `.env`, not used by current runtime |

Notes:
- `.gitignore` excludes `backend/.env` (`.gitignore:3`).
- Do not commit real credentials.

## 7) API Surface (Observed)

All endpoints are served by `backend/server.js`.

| Method | Route | Auth | Input validation | Notes |
|---|---|---|---|---|
| POST | `/api/register` | None | Checks duplicate email only | Stores password directly as provided |
| POST | `/api/login` | None | Email/password presence implied by query usage | Compares plaintext password in SQL query |
| GET | `/api/jobs` | None | N/A | Public job listings |
| POST | `/api/apply` | None | No required-field validation in route | Accepts empty strings and inserts application row |
| GET | `/api/admin/jobs` | None | N/A | Exposes admin job list publicly |
| POST | `/api/admin/jobs` | None | Requires `title`, `company`, non-empty `description` | Creates job |
| DELETE | `/api/admin/jobs/:id` | None | Existence check on `affectedRows` | Returns 404 even when deletion actually occurs (observed) |
| GET | `/api/admin/applications` | None | N/A | Exposes application data publicly |

Evidence references:
- Register/login password flow: `backend/server.js:40`, `backend/server.js:48`, `backend/server.js:61`
- Apply route and insert: `backend/server.js:84`, `backend/server.js:88`
- Admin routes: `backend/server.js:181`, `backend/server.js:192`, `backend/server.js:214`, `backend/server.js:227`
- Delete 404 condition: `backend/server.js:218`
- `affectedRows` source: `backend/database.js:67`

## 8) Frontend Behavior

### Page responsibilities

| Page | Primary purpose | Scripts |
|---|---|---|
| `index.html` | Marketing/landing page + contact form overlay | `script/scripts.js` |
| `apply.html` | Job listing, filtering, and application submission | `script/config.js`, `script/apply.js`, `script/scripts.js` |
| `signin.html` | Login/registration tabs | `script/config.js`, `script/signin.js` |
| `admin.html` | Job management dashboard | `script/config.js`, `script/admin.js` |

### Client-side session model
- Uses `localStorage` key `punaime_user`
- Admin page checks only localStorage presence (`script/admin.js:3`, `script/admin.js:5`)
- No server-issued session/token is used by admin API calls

### Rendering details relevant to security
- Job description is injected with `innerHTML` in apply page: `script/apply.js:177`
- Job description is injected with `innerHTML` in admin modal: `script/admin.js:78`

## 9) Database Model and Runtime Data Snapshot

Runtime database engine:
- `sql.js` loads database file into memory, then exports to disk on mutations/process exit (`backend/database.js`)

Tables detected in `backend/punaime.db`:
- `users`
- `jobs`
- `applications`

Observed row counts during audit:
- `users`: 3
- `jobs`: 36
- `applications`: 4

Schema observations:
- Runtime table creation logic exists in `backend/init-db.js` (SQLite syntax)
- `backend/schema.sql` and `backend/add_jobs.sql` are MySQL-oriented (`CREATE DATABASE`, `USE`, `AUTO_INCREMENT`, `BOOLEAN`) and do not match runtime SQLite usage

Evidence:
- MySQL constructs: `backend/schema.sql:1`, `backend/schema.sql:3`, `backend/schema.sql:7`, `backend/schema.sql:21`
- SQLite runtime schema source: `backend/init-db.js:26`

## 10) Quality and Security Findings (Severity Ranked)

### Critical

1. Plaintext password storage and authentication
- Evidence: `backend/server.js:48`, `backend/server.js:61`
- Impact: Password disclosure risk and non-compliance with standard security practice
- Recommendation: Hash passwords with `bcrypt`/`argon2`, compare hash at login, add password policy

2. No authentication/authorization on admin APIs
- Evidence: `backend/server.js:181`, `backend/server.js:192`, `backend/server.js:214`, `backend/server.js:227`
- Impact: Anyone who can reach the server can list/create/delete jobs and read applications
- Recommendation: Add real auth (session/JWT), role checks, and server-side authorization middleware

3. Stored XSS risk through unsanitized job descriptions
- Evidence: `script/admin.js:78`, `script/apply.js:177`
- Impact: Malicious HTML/JS in job descriptions can execute in user/admin browsers
- Recommendation: Sanitize HTML on input/output (for example DOMPurify) or render as text

### High

4. DELETE endpoint returns false-negative 404 despite deleting records
- Evidence: `backend/server.js:218`, `backend/database.js:67`
- Observed behavior: Delete request returned 404 while job count decreased in same session
- Impact: Client/server inconsistency, incorrect UX, potential retry side effects
- Recommendation: Rework delete result detection (for example use explicit pre-check + delete, or SQLite `changes()` query)

5. `/api/apply` accepts empty payload fields and records them
- Evidence: `backend/server.js:84`, `backend/server.js:88`
- Observed behavior: Empty strings were accepted with HTTP 200 and success message
- Impact: Data quality degradation and unusable application records
- Recommendation: Add strict request validation (required, format, length)

### Medium

6. Client-only admin gate is bypassable
- Evidence: `script/admin.js:3`, `script/admin.js:5`
- Impact: UI redirect can be bypassed by manually setting localStorage; server has no auth checks
- Recommendation: Treat localStorage as UX-only; enforce auth on server

7. Global permissive CORS without route-level control
- Evidence: `backend/server.js:32`
- Impact: Broad cross-origin access to sensitive endpoints
- Recommendation: Restrict allowed origins/methods, especially for admin routes

8. Mixed database strategy in repository docs/scripts
- Evidence: `backend/schema.sql:1`, `backend/add_jobs.sql:1`, runtime SQLite in `backend/database.js`
- Impact: Operational confusion and onboarding errors
- Recommendation: Keep one authoritative DB path; archive or relabel MySQL scripts

9. Contact form JS assumes DOM elements exist on every page where script is loaded
- Evidence: `script/scripts.js:152`
- Impact: Potential runtime error on pages without `#contactForm`
- Recommendation: Add null guards before adding listeners

### Low

10. Hardcoded API base URL in frontend config
- Evidence: `script/config.js:2`
- Impact: Deployment friction across environments
- Recommendation: Externalize by environment or derive from `window.location`

11. No automated tests in repository
- Evidence: no discovered `*.test.*`/`*.spec.*` files
- Impact: Regression risk
- Recommendation: Add minimal API integration and frontend smoke tests

## 11) Dependency Audit Result

Command executed:

```bash
cd backend
npm audit --json
```

Observed summary:
- `1` high vulnerability (`nodemailer`)
- `1` low vulnerability (`qs`)

Key notes:
- Advisory references indicated by npm audit:
  - `nodemailer` domain interpretation issue (`GHSA-mm7p-fcc7-pg87`)
  - `nodemailer` DoS issue in address parser (`GHSA-rcmh-qjqh-p98v`)
  - `qs` arrayLimit bypass (`GHSA-w7fw-mjwx-w883`)

Action:
- Upgrade dependencies to patched versions and re-run audit in CI.

## 12) Runtime Verification Performed

Checks completed:
- JS syntax check over first-party JS files: passed
- API smoke tests:
  - Register: success
  - Duplicate register: HTTP 400
  - Login with wrong password: HTTP 401
  - Jobs list: HTTP 200
  - Apply: HTTP 200 (including empty-field case)
  - Admin job create: HTTP 200
  - Admin job delete: returned HTTP 404 while deletion still occurred (observed)

Database file integrity handling during write tests:
- Database was backed up and restored around mutating smoke tests.

## 13) Operational Notes

- The backend serves static frontend files directly from repository root.
- `backend/punaime.db` is tracked in git. This means repository clones carry data state, not only schema.
- A large document file (`Zhvillimi i Web Aplikacionit per Aplikim per pune.docx`) exists in root but is not used by runtime code.

## 14) Priority Remediation Plan

1. Implement server-side authentication/authorization for all admin endpoints.
2. Hash passwords and migrate existing plaintext credentials.
3. Fix delete endpoint response semantics and add regression tests.
4. Add request validation middleware for all mutating endpoints.
5. Sanitize or escape job description rendering to remove XSS path.
6. Restrict CORS and externalize API base URL by environment.
7. Align database strategy and documentation (SQLite vs MySQL scripts).
8. Add automated tests and CI checks (`npm audit`, endpoint tests, lint/syntax checks).

## 15) Reproducibility Commands

Install and run:

```bash
cd backend
npm install
npm run setup-db
npm start
```

Quick API check (PowerShell):

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/jobs
```

Dependency audit:

```bash
cd backend
npm audit
```

---

If this README is used as a baseline for future audits, keep the "Audit Metadata" section updated with the exact audit date and environment.
