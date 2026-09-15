# WorkPulse (PunaIme) - Technical Documentation & Platform Architecture

**WorkPulse (PunaIme)** is a modern web platform designed for job recruitment, candidate matching, and hiring workflow management in Kosovo and the wider region. The platform serves three distinct user roles: **Jobseekers** (browse, filter, apply with CVs, and track status), **Employers** (publish jobs, review applicants via an integrated ATS, manage company profiles, and upgrade plans), and **Administrators** (global user management, job moderation, and system analytics).

---

## 1. Project Overview & Architecture

The platform is built with a decoupled, modular architecture:

- **Frontend**: Lightweight, high-performance vanilla web stack (HTML5, modern CSS3 with custom properties and dynamic Light/Dark mode, modular ES6+ JavaScript).
- **Backend**: Node.js & Express (ES Modules) organized around a clean layered architecture:
  $$\text{Client Request} \longrightarrow \text{Security \& Middleware} \longrightarrow \text{Validators} \longrightarrow \text{Routes} \longrightarrow \text{Services} \longrightarrow \text{Database Client}$$
- **Database Engine**: File-based SQLite powered by `sql.js` with automated migration runner (`backend/src/db/migrations/`) and reliable persistent disk sync (`backend/punaime.db`).
- **Authentication & Authorization**:
  - Secure password hashing with `bcryptjs`.
  - Session management via HTTP-only secure cookies (`platforma_session`) and Bearer token fallback.
  - Native Google OAuth 2.0 Sign-In via `google-auth-library`.
  - Role-Based Access Control (RBAC): Enforced server-side for `admin`, `employer`, and `jobseeker`.
- **Security & Reliability**:
  - `helmet` security headers configured with Content Security Policy (CSP) for Google Sign-In and local assets.
  - Granular rate limiting (`express-rate-limit`) on general API endpoints and stricter thresholds on authentication mutations.
  - Strict input sanitization and schema validation (`express-validator`).
  - Protected file upload pipeline via `multer` for applicant resumes (PDF, DOC, DOCX) with gated download endpoints (`/api/applications/:id/cv`).

---

## 2. Complete Repository File Structure

```text
Platforma/
├── .gitignore                         # Strict exclusion rules for secrets, DBs, uploads, node_modules
├── README.md                          # Comprehensive technical documentation (this file)
├── LOGO-PunaIme.png                   # Official platform logo asset
├── Platforma_Plan.md                  # System design specifications
├── Implement_Platforma_Plan.md        # Implementation and testing plan
├── temp-start-backend.js              # Auxiliary startup script
│
├── Frontend HTML Pages:
│   ├── index.html                     # Landing page (hero, search preview, categories, stats, partners, contact modal)
│   ├── apply.html                     # Job catalog, dynamic filters, job details modal, and CV submission form
│   ├── signin.html                    # Unified authentication portal (Login / Register, Role selection, Google OAuth)
│   ├── reset-password.html            # Password reset request and token verification form
│   ├── pricing.html                   # Employer subscription tiers (Free, Standard, Premium, Enterprise)
│   ├── employer-dashboard.html        # Employer overview (active jobs, applicant counts, quick metrics)
│   ├── employer-jobs.html             # Employer job posting management (CRUD, status toggling)
│   ├── employer-applications.html     # Employer Applicant Tracking System (ATS), CV download, status pipeline
│   ├── employer-company-settings.html # Employer company profile and branding settings
│   ├── jobseeker-dashboard.html       # Candidate dashboard (application overview, recent submissions)
│   ├── jobseeker-applications.html    # Candidate application history and status tracking
│   ├── admin.html                     # Administrative portal (user management, job moderation, platform metrics)
│   ├── privacy.html                   # Platform privacy policy
│   └── terms.html                     # Terms of service
│
├── script/                            # Client-Side Application Logic (Modular JavaScript)
│   ├── admin.js                       # Admin panel data fetching, user moderation, and metrics
│   ├── apply.js                       # Job catalog filtering, pagination, search, modal view, and application submission
│   ├── config.js                      # Global frontend configuration (API base URL)
│   ├── pricing.js                     # Plan selection logic, billing toggle (monthly/yearly), modal workflows
│   ├── reset-password.js              # Password recovery token handling and submission
│   ├── scripts.js                     # Homepage animations, mobile navigation drawer, newsletter & contact form
│   ├── signin.js                      # Form validation, tab switcher, Google Sign-In integration, session redirection
│   ├── employer/
│   │   ├── applications.js            # ATS applicant review, pipeline stage updates, CV download trigger
│   │   ├── company-settings.js        # Company profile updates and persistence
│   │   ├── dashboard.js               # Employer analytics and summary card hydration
│   │   └── jobs.js                    # Job creation, modification, and deletion workflows
│   ├── jobseeker/
│   │   ├── applications.js            # Jobseeker application timeline and status history
│   │   └── dashboard.js               # Jobseeker metric cards and active applications overview
│   └── shared/
│       ├── api.js                     # Centralized Fetch wrapper with credentials and error handling
│       ├── auth.js                    # Session state watcher, RBAC route guards, and logout handling
│       ├── modern-animations.js       # Scroll reveal and UI transitions
│       ├── partners-section.js        # Partner organization carousel and logo grid
│       ├── stats-counter.js           # Animated number counters for metrics
│       ├── theme-manager.js           # Light/Dark mode manager persisted in localStorage
│       └── toast.js                   # Interactive toast notification dispatcher
│
├── styles/                            # Design & Layout Stylesheets
│   ├── modern-sections.css            # Styles for modern homepage sections and feature cards
│   ├── partner-section.css            # Partner logo carousel styling
│   ├── pricing.css                    # Pricing grid, comparison table, and modal styling
│   ├── signin.css                     # Authentication forms, tab headers, and social buttons
│   ├── style.css                      # Base layout, typography, and utility classes
│   ├── styles.css                     # Supplemental component styles
│   └── theme.css                      # Theme custom properties (Light & Dark color tokens)
│
└── backend/                           # Node.js / Express Server & Micro-Services
    ├── package.json                   # Dependency definitions and scripts (v2.0.0)
    ├── package-lock.json              # Pinned dependency lockfile
    ├── .env.example                   # Safe environment variable template
    ├── schema.sql                     # Legacy schema reference
    ├── add_jobs.sql                   # Sample job seeds
    ├── database.js                    # Legacy database connector
    ├── init-db.js                     # Legacy DB initialization script
    ├── server.js                      # Legacy server entry
    ├── scripts/
    │   ├── migrate.js                 # Database schema migration runner
    │   ├── seed.js                    # Database seeder execution script
    │   ├── seed-lib.js                # Seed data generator helper
    │   └── add_medical_education_jobs.js # Specialized sector job seeds
    ├── tests/
    │   └── smoke.test.js              # Automated test suite (health checks, route security guards)
    ├── uploads/
    │   └── cv/
    │       └── .gitkeep               # Preserves uploads folder structure (PDFs ignored in git)
    └── src/                           # Modular Backend Architecture v2.0
        ├── app.js                     # Express app factory, middlewares, security, routes, error handlers
        ├── server.js                  # Main runtime entry point, DB initialization, and HTTP listener
        ├── config/
        │   ├── constants.js           # Role constants (ADMIN, EMPLOYER, JOBSEEKER), statuses, plans
        │   └── env.js                 # Environment configuration loader with fallbacks
        ├── db/
        │   ├── client.js              # SQLite wrapper (sql.js) with auto-persistence
        │   └── migrations/
        │       ├── index.js           # Versioned migration schemas
        │       └── runner.js          # Migration engine
        ├── middleware/
        │   ├── auth.js                # Session reader & authentication enforcement (`requireAuth`)
        │   ├── error-handler.js       # Global structured JSON error and 404 handlers
        │   ├── request-id.js          # Request correlation ID middleware (`X-Request-Id`)
        │   ├── roles.js               # Role-Based Access Control (`requireRole`)
        │   ├── upload.js              # Multer configuration for secure CV file uploads (PDF, DOC, DOCX)
        │   └── validate.js            # Express-validator result parser
        ├── routes/
        │   ├── admin.routes.js        # Admin management routes
        │   ├── applications.routes.js # Application submission & CV retrieval routes
        │   ├── auth.routes.js         # Authentication, registration, and Google OAuth routes
        │   ├── contact.routes.js      # Contact inquiry submission routes
        │   ├── employer.routes.js     # Employer ATS, job CRUD, and company settings routes
        │   ├── jobs.routes.js         # Public job search and filter routes
        │   ├── jobseeker.routes.js    # Candidate profile and application history routes
        │   └── reports.routes.js      # Aggregated metrics and report routes
        ├── services/
        │   ├── analytics.service.js   # Analytics aggregations for dashboards
        │   ├── auth.service.js        # Bcrypt authentication, user registration, and sessions
        │   ├── email.service.js       # Nodemailer notification delivery
        │   └── token.service.js       # Session token generation and validation
        ├── utils/
        │   ├── async-handler.js       # Async error wrapper for Express routes
        │   └── sanitize.js            # Input sanitization against XSS
        └── validators/
            ├── admin.validators.js    # Validation rules for admin mutations
            ├── application.validators.js # Validation rules for job applications
            ├── auth.validators.js     # Validation rules for authentication
            ├── employer.validators.js # Validation rules for employer operations
            └── job.validators.js      # Validation rules for job postings
```

---

## 3. Security, Privacy & `.gitignore`

The repository is configured with a comprehensive `.gitignore` in the root directory to guarantee that **no confidential, proprietary, or private user data is ever exposed in version control**:

- **Secrets and Configuration**: `.env`, `backend/.env`, and any `*.env` files are strictly excluded. Only the sanitised `backend/.env.example` file is tracked.
- **Personal Identifiable Information (PII) / Candidate Resumes**: All files uploaded by users to `backend/uploads/cv/*` (PDF, DOC, DOCX) are excluded from Git to maintain GDPR and privacy compliance. The directory structure is preserved via `.gitkeep`.
- **Database Files**: Local SQLite files (`backend/punaime.db`, `*.db`, `*.sqlite3`) are excluded so real user records, hashes, and tokens are never committed.
- **Dependencies & Build Artifacts**: `node_modules/`, `backend/node_modules/`, `logs/`, `.scannerwork/`, and `sonar-project.properties` are completely ignored.

---

## 4. Environment Variables

To configure the backend environment, create a `.env` file in the `backend/` directory by copying `.env.example`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Default Value | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment (`development` or `production`) |
| `PORT` | `3000` | HTTP port on which the Express server listens |
| `APP_ORIGIN` | `http://localhost:3000` | Allowed client origin for CORS and session cookies |
| `SESSION_SECRET` | `ndrysho-kete-ne-produksion` | Secret key used for signing session cookies |
| `SESSION_COOKIE_NAME` | `platforma_session` | Name of the session cookie |
| `SESSION_TTL_SECONDS` | `604800` (7 days) | Session expiration time in seconds |
| `EMAIL_USER` | `""` | SMTP sender email account for Nodemailer notifications |
| `EMAIL_PASS` | `""` | SMTP application password for authentication |
| `ADMIN_EMAIL` | `""` | Recipient email for administrative notifications |
| `DEFAULT_FROM_EMAIL` | `""` | Default sender header email address |
| `GOOGLE_CLIENT_ID` | `""` | Google Cloud OAuth Client ID for Google Sign-In |
| `DB_FILE` | `backend/punaime.db` | Absolute or relative path to the SQLite database file |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 minutes) | Sliding time window for rate limiting |
| `RATE_LIMIT_MAX_REQUESTS` | `10000` | Maximum requests permitted per rate limit window |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | `1000` | Maximum requests permitted for sensitive auth routes |
| `APPLY_RATE_LIMIT_MAX_REQUESTS` | `30` | Maximum job applications permitted per time window |

> [!WARNING]
> Never commit real passwords, SMTP credentials, or Google OAuth secrets to version control.

---

## 5. Getting Started & Local Development

### Prerequisites
- **Node.js**: Version 18 or newer (tested on Node 22).
- **npm**: Version 9 or newer.

### Installation & Database Initialization

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database migrations and seed initial data
npm run setup-db

# Launch development server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Running Automated Tests

```bash
cd backend
npm test
```

The test runner verifies endpoint liveness (`GET /api/health`) and validates that secure resources (such as `/api/applications/:id/cv`) reject unauthorized requests with HTTP 401.

---

## 6. Frontend Navigation & Pages

| Page | URL Path | Intended Audience |
|---|---|---|
| Landing Page | `http://localhost:3000/index.html` | Public |
| Job Search & Listings | `http://localhost:3000/apply.html` | Public / Jobseeker |
| Sign-In & Registration | `http://localhost:3000/signin.html` | Public |
| Password Recovery | `http://localhost:3000/reset-password.html` | Public |
| Pricing & Plans | `http://localhost:3000/pricing.html` | Public / Employer |
| Employer Dashboard | `http://localhost:3000/employer-dashboard.html` | Employer |
| Job Management | `http://localhost:3000/employer-jobs.html` | Employer |
| Candidate ATS Pipeline | `http://localhost:3000/employer-applications.html` | Employer |
| Company Settings | `http://localhost:3000/employer-company-settings.html` | Employer |
| Jobseeker Dashboard | `http://localhost:3000/jobseeker-dashboard.html` | Jobseeker |
| My Applications | `http://localhost:3000/jobseeker-applications.html` | Jobseeker |
| Admin Dashboard | `http://localhost:3000/admin.html` | Administrator |
| Privacy Policy | `http://localhost:3000/privacy.html` | Public |
| Terms of Service | `http://localhost:3000/terms.html` | Public |

---

## 7. REST API Reference

All backend endpoints are served under the `/api` namespace.

### Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` - Register a new account with role selection (`jobseeker` or `employer`). Passwords hashed with `bcryptjs`.
- `POST /api/auth/login` - Authenticate via email/password; creates a session and sets an HTTP-only cookie.
- `POST /api/auth/google` - Authenticate using a Google OAuth credential token.
- `GET /api/auth/google/config` - Retrieve public Google Client ID configuration for the frontend.
- `POST /api/auth/forgot-password` - Request a password reset link sent to the user's email.
- `POST /api/auth/reset-password` - Update password using a valid cryptographic reset token.
- `GET /api/auth/me` - Retrieve the currently authenticated user's profile and role.
- `POST /api/auth/logout` - Invalidate session and destroy the session cookie.

### Job Listings (`/api/jobs`)
- `GET /api/jobs` - Public job search with filtering (category, type, location, schedule) and pagination.
- `GET /api/jobs/:id` - Full details of a specific job listing.
- `GET /api/jobs/categories` - Distinct categories of currently available jobs.

### Applications & CV Management (`/api/applications`)
- `POST /api/applications` - Submit an application with a multipart CV file upload (PDF/DOC/DOCX via Multer).
- `GET /api/applications/my` - Retrieve all applications submitted by the currently logged-in candidate.
- `GET /api/applications/:id` - Retrieve details of a specific application.
- `GET /api/applications/:id/cv` - Secure CV download endpoint (restricted to the employer owning the job listing or platform admin).

### Employer Management (`/api/employer`) - *Requires `employer` role*
- `GET /api/employer/dashboard` - Employer dashboard metrics (active jobs, total applicants, views).
- `GET /api/employer/jobs` - List all jobs created by the employer's company.
- `POST /api/employer/jobs` - Create a new job listing.
- `PUT /api/employer/jobs/:id` - Update an existing job listing.
- `PATCH /api/employer/jobs/:id/status` - Toggle active/inactive status of a job posting.
- `DELETE /api/employer/jobs/:id` - Remove a job posting.
- `GET /api/employer/applications` - Retrieve candidate submissions for the employer's jobs.
- `PATCH /api/employer/applications/:id/status` - Update candidate review status (`reviewing`, `interview`, `accepted`, `rejected`).
- `GET /api/employer/company` - Retrieve company profile information.
- `PUT /api/employer/company` - Update company details, logo, website, and description.
- `GET /api/employer/plans` - View subscription plan tiers and current plan status.
- `POST /api/employer/plans/upgrade` - Request an upgrade to a higher tier.

### Jobseeker Services (`/api/jobseeker`) - *Requires `jobseeker` role*
- `GET /api/jobseeker/dashboard` - High-level summary of candidate activity and recommendations.
- `GET /api/jobseeker/applications` - Comprehensive application history with live status updates.
- `GET /api/jobseeker/profile` - Retrieve candidate profile details.
- `PUT /api/jobseeker/profile` - Update candidate profile information.

### Platform Administration (`/api/admin`) - *Requires `admin` role*
- `GET /api/admin/stats` - Platform-wide statistics (total users, active jobs, submitted applications).
- `GET /api/admin/users` - View and search platform users with role filtering.
- `PATCH /api/admin/users/:id/role` - Modify a user's assigned role.
- `DELETE /api/admin/users/:id` - Permanently delete a user account.
- `GET /api/admin/jobs` - Global job moderation list.
- `DELETE /api/admin/jobs/:id` - Administratively remove any job listing.
- `GET /api/admin/applications` - Platform-wide application audit feed.

### System & Contact Services
- `GET /api/health` - Health check endpoint for uptime and deployment monitoring.
- `POST /api/contact` - Submit contact inquiries with notification dispatch to the administrator.
- `GET /api/reports/jobs-summary` - Summary report of posted jobs and status distributions.

---

## 8. Version 2.0 Security & Architecture Enhancements

The platform includes key structural and security enhancements over early prototypes:
1. **Password Hashing**: Implemented `bcryptjs` with high work factor; plaintext credentials are eliminated.
2. **Server-Side Authorization**: Endpoints are strictly guarded with `requireAuth` and `requireRole` middleware; client-side localStorage is used only for UI state.
3. **Defense-in-Depth (XSS & Validation)**: All input mutations are validated through `express-validator` and sanitized prior to persistence.
4. **Protected Storage of Personal Data**: Direct static directory browsing of `backend/uploads/` is blocked with HTTP 404; resume downloads require verified ownership.
5. **Rate Limiting**: Multi-tiered `express-rate-limit` prevents credential stuffing, brute-force attacks, and submission flooding.
6. **Automated Verification**: Integrated test suite runnable with `npm test` ensures critical security regressions are detected early.
