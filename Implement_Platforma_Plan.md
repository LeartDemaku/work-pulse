# Implement Platforma Plan

## 1) Document Objective

This document defines an objective implementation strategy for every feature in `Platforma_Plan.md`, with:
- Practical execution steps
- Clear sequencing and dependencies
- Page-by-page implementation detail
- Backend, database, email, security, localization, and analytics coverage

Primary implementation rule: stay on current stack (HTML/CSS/JS + Node/Express + SQLite + Nodemailer) and only add low-complexity libraries where required.

## 2) Global Implementation Strategy

1. Stabilize core architecture first.
2. Enforce role separation across database, API, and UI before feature expansion.
3. Build end-to-end flows for one role at a time while keeping shared components reusable.
4. Add observability and safety controls early (logging, validation, auth, rate limiting).
5. Release in small increments with rollback-safe database migrations.

## 3) Delivery Workstreams

WS1. Data and migration layer  
WS2. Authentication and authorization  
WS3. Public job discovery and apply flow  
WS4. Job seeker dashboard and application tracking  
WS5. Employer onboarding, job management, and candidate pipeline  
WS6. Admin moderation and reporting  
WS7. Email notification engine  
WS8. Localization and Kosovo-specific UX  
WS9. Security hardening and reliability  
WS10. Analytics and operational tooling

## 4) Repository Refactor Plan

## 4.1 Backend structure

Create:

```text
backend/
  src/
    app.js
    server.js
    config/
      env.js
      constants.js
    db/
      client.js
      migrations/
      repositories/
    middleware/
      auth.js
      roles.js
      validate.js
      error-handler.js
      request-id.js
    routes/
      auth.routes.js
      jobs.routes.js
      applications.routes.js
      employer.routes.js
      admin.routes.js
      notifications.routes.js
    services/
      auth.service.js
      job.service.js
      application.service.js
      employer.service.js
      email.service.js
      analytics.service.js
      moderation.service.js
    validators/
      auth.validators.js
      job.validators.js
      application.validators.js
      employer.validators.js
  uploads/
  logs/
  scripts/
    migrate.js
    seed.js
```

## 4.2 Frontend structure

Create:

```text
script/
  shared/
    api.js
    auth.js
    toast.js
    form-validation.js
    i18n.js
    session-guard.js
  auth/
    signin.js
    signup-role.js
  jobseeker/
    apply.js
    dashboard.js
    applications.js
    profile.js
  employer/
    dashboard.js
    jobs.js
    applications.js
    company-settings.js
  admin/
    moderation.js
    reports.js
```

## 5) Dependency Additions and Setup Steps

Install in `backend`:

1. `bcryptjs`
2. `express-validator`
3. `multer`
4. `helmet`
5. `express-rate-limit`
6. `cookie-parser`
7. `nanoid` (for references and verification tokens)

Implementation steps:

1. Add dependencies in `backend/package.json`.
2. Add npm scripts:
   - `migrate`
   - `seed`
   - `start`
   - `dev`
   - `check`
3. Add `.env.example` with required variables.
4. Keep `.env` untracked.

## 6) Database Implementation Plan (Full Feature Coverage)

## 6.1 Migration baseline

1. Create migration framework (`backend/src/db/migrations` + `backend/scripts/migrate.js`).
2. Add migration tracking table `schema_migrations`.
3. Backup existing `punaime.db` before first migration.
4. Run migrations in sequence and validate with smoke queries.

## 6.2 Users table upgrades

Steps:

1. Add columns:
   - `role TEXT NOT NULL DEFAULT 'job_seeker'`
   - `password_hash TEXT`
   - `is_email_verified INTEGER NOT NULL DEFAULT 0`
   - `last_login_at DATETIME`
   - `status TEXT NOT NULL DEFAULT 'active'`
2. Migrate existing plaintext passwords:
   - For each user, hash `password` into `password_hash`.
   - Remove or ignore plaintext `password` in runtime code.
3. Add constraints:
   - `CHECK (role IN ('job_seeker','employer','admin'))`
   - `CHECK (status IN ('active','suspended','deleted'))`

## 6.3 New profile and company tables

Create:

1. `job_seeker_profiles`
2. `companies`
3. `employer_members` (Phase 2 optional but schema created in Phase 1 for forward compatibility)

Key indexes:

1. `users(email)` unique
2. `companies(owner_user_id)`
3. `employer_members(company_id, user_id)` unique

## 6.4 Jobs table evolution

1. Add columns:
   - `company_id`
   - `employment_type`
   - `experience_level`
   - `deadline_at`
   - `status`
   - `salary_min`, `salary_max`, `currency`
   - `required_skills_json`
   - `work_mode` (`onsite`, `remote`, `hybrid`)
2. Add constraints and defaults:
   - `status IN ('draft','active','paused','closed','archived')`
   - `currency DEFAULT 'EUR'`
3. Backfill existing jobs with:
   - default `status='active'`
   - default `currency='EUR'`

## 6.5 Applications table evolution

1. Add columns:
   - `job_id`
   - `job_seeker_user_id`
   - `status`
   - `status_updated_at`
   - `cover_letter`
   - `cv_file_path`
   - `source`
   - `reference_code`
2. Retain `job_title` temporarily for backward compatibility.
3. Populate `job_id` for new records; gradually deprecate `job_title`.
4. Add constraints:
   - `status IN ('submitted','viewed','shortlisted','interview','offer','rejected','hired','withdrawn')`

## 6.6 Supporting tables

Create:

1. `application_status_history`
2. `saved_jobs`
3. `email_logs`
4. `job_templates`
5. `notifications` (for optional in-app notification center)
6. `report_flags` (job or application reports)
7. `moderation_actions`
8. `analytics_events`

## 7) Authentication and Session Implementation Plan

## 7.1 Register flow

Steps:

1. Build `POST /api/auth/register` with role-aware payload validation.
2. For `job_seeker`:
   - Create user row
   - Create profile scaffold row
3. For `employer`:
   - Create user row
   - Create company row with initial fields
4. Hash password using `bcryptjs`.
5. Generate email verification token for employer by default.
6. Return safe user object (no sensitive fields).

## 7.2 Login flow

1. Build `POST /api/auth/login`.
2. Validate email/password.
3. Compare with `password_hash`.
4. Issue signed session token in HTTP-only cookie.
5. Persist `last_login_at`.
6. Return role and minimal profile metadata.

## 7.3 Logout and me

1. `POST /api/auth/logout`: clear cookie and session state.
2. `GET /api/auth/me`: return current identity and permissions.

## 7.4 Role middleware

1. `requireAuth`: validates session.
2. `requireRole`: checks one or many roles.
3. Apply to every employer/admin endpoint.

## 8) API Implementation Steps by Domain

## 8.1 Auth API

Implement:

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `POST /api/auth/logout`
4. `GET /api/auth/me`
5. `POST /api/auth/verify-email`
6. `POST /api/auth/resend-verification`

Acceptance:

1. Employer cannot post jobs before verification.
2. Job seeker can apply immediately after registration.

## 8.2 Job seeker APIs

Implement:

1. `GET /api/jobs`
2. `GET /api/jobs/:id`
3. `POST /api/applications`
4. `GET /api/jobseeker/applications`
5. `PATCH /api/jobseeker/applications/:id/withdraw`
6. `POST /api/jobseeker/saved-jobs`
7. `DELETE /api/jobseeker/saved-jobs/:jobId`
8. `GET /api/jobseeker/recommendations`
9. `PUT /api/jobseeker/profile`
10. `GET /api/jobseeker/profile`

Acceptance:

1. Status timeline is returned with each application.
2. Withdraw is blocked for statuses at/after interview.

## 8.3 Employer APIs

Implement:

1. `GET /api/employer/company`
2. `PUT /api/employer/company`
3. `POST /api/employer/jobs`
4. `PUT /api/employer/jobs/:id`
5. `PATCH /api/employer/jobs/:id/status`
6. `POST /api/employer/jobs/:id/duplicate`
7. `GET /api/employer/jobs`
8. `GET /api/employer/jobs/:id/applications`
9. `PATCH /api/employer/applications/:id/status`
10. `POST /api/employer/applications/:id/note`
11. `GET /api/employer/applications/export.csv`
12. `POST /api/employer/members/invite` (Phase 2)

Acceptance:

1. Employer sees only own company jobs/applications.
2. Status changes write to history and trigger email workflow.

## 8.4 Admin APIs

Implement:

1. `GET /api/admin/reports`
2. `GET /api/admin/users`
3. `PATCH /api/admin/users/:id/status`
4. `PATCH /api/admin/jobs/:id/moderation-status`
5. `GET /api/admin/report-flags`
6. `POST /api/admin/report-flags/:id/resolve`

Acceptance:

1. Only `admin` role can call these.
2. Moderation actions are audited in `moderation_actions`.

## 9) Public and Shared Page Implementation Plan

## 9.1 `index.html`

Steps:

1. Add dual CTA block:
   - Find Jobs
   - Post a Job
2. Add role-specific feature blocks.
3. Replace static metrics with dynamic fetch from `/api/public/stats`.
4. Contact form:
   - keep current flow
   - add support SLA text
   - add graceful fallback for API errors

Acceptance:

1. Hero communicates two entry journeys clearly.
2. Stats render without layout shift.

## 9.2 Shared header/footer

1. Build shared script that renders nav items based on role.
2. Ensure all pages show correct auth actions.
3. Reduce duplicated markup drift by keeping shared templates in JS.

## 10) Signin and Onboarding Implementation Plan

## 10.1 `signin.html` and auth scripts

Steps:

1. Add role selector step.
2. Render role-specific form fields.
3. Add stronger form validation:
   - email format
   - password length/complexity
   - Kosovo phone format
4. Register via `/api/auth/register`.
5. Show verification pending state for employer accounts.

Acceptance:

1. Role persisted in account record.
2. Employer user is blocked from posting jobs until verified.

## 11) Job Listing and Apply Flow Implementation Plan

## 11.1 `apply.html`

Steps:

1. Add filter panel:
   - location
   - category
   - employment type
   - experience level
   - work mode
2. Add sorting options:
   - newest
   - deadline soon
3. Expand job detail view:
   - required skills
   - employer profile link
   - posted date
   - deadline
4. Apply form changes:
   - prefill from job seeker profile
   - cover letter
   - CV upload (multer)
   - CV from saved docs
5. Submit to `/api/applications`.
6. Display confirmation with `reference_code`.
7. Trigger seeker confirmation email.

Acceptance:

1. Application submitted with normalized data and non-empty required fields.
2. Seeker sees record instantly in dashboard timeline.

## 12) Job Seeker Dashboard and Applications Plan

## 12.1 `jobseeker-dashboard.html`

Steps:

1. Build profile completeness widget.
2. Show saved jobs list.
3. Show recent applications with status badges.
4. Show recommendation cards (simple keyword match from profile skills to job title/skills).

## 12.2 `jobseeker-applications.html`

Steps:

1. Build grouped list by status.
2. Add filters by status and date range.
3. Show timeline per application from `application_status_history`.
4. Add withdraw action with server rule enforcement.

Acceptance:

1. Statuses and timestamps are consistent with backend history table.
2. Withdraw action hidden/disabled when not eligible.

## 13) Employer Portal Implementation Plan

## 13.1 `employer-dashboard.html`

Steps:

1. Fetch KPI cards:
   - active jobs
   - new applications
   - pending review
2. Add quick actions:
   - create job
   - open application inbox
3. Add deadline alerts module.

## 13.2 `employer-jobs.html`

Steps:

1. Build job list with statuses.
2. Add create job form:
   - title, description, category
   - location/work mode
   - type/experience
   - deadline
   - salary range
3. Add edit flow.
4. Add archive/pause/close actions.
5. Add duplicate action.
6. Add job templates support.

## 13.3 `employer-applications.html`

Steps:

1. Group applications by job.
2. Candidate card fields:
   - full profile snapshot
   - CV link
   - contact details
   - notes
3. Add status controls and bulk actions.
4. Add CSV export.
5. Add "contact via email" action.

## 13.4 `employer-company-settings.html`

Steps:

1. Manage company profile.
2. Set notification email preference.
3. Add logo upload.
4. Add team invite flow (Phase 2).

Acceptance:

1. Employer can run full hire loop without admin panel access.
2. All data scoped to employer company.

## 14) Admin Panel Implementation Plan

## 14.1 `admin.html` scope reset

Steps:

1. Remove employer job management from admin page.
2. Add moderation modules:
   - reported jobs
   - reported applications
   - user/account controls
3. Add verify company actions.
4. Add suspend user/account actions.
5. Add moderation logs view.

Acceptance:

1. Admin page is platform governance only.
2. All admin actions are auditable.

## 15) Email System Implementation Plan

## 15.1 Email service architecture

Steps:

1. Build centralized `email.service.js`.
2. Define template keys:
   - `application_received`
   - `status_changed_shortlisted`
   - `status_changed_interview`
   - `status_changed_rejected`
   - `status_changed_hired`
   - `new_application_received`
   - `job_expiring_soon`
3. Create HTML + plain text templates.
4. Add language support (`sq`, `en`).

## 15.2 Trigger wiring

1. On application create:
   - send seeker confirmation
   - send employer new application email
2. On status update:
   - send seeker status update
3. Daily scheduler endpoint/script:
   - job expiring reminders

## 15.3 Delivery safety

1. Add retries (simple attempt count, exponential delay).
2. Persist every send attempt in `email_logs`.
3. Add admin visibility for failed sends.

Acceptance:

1. Failed email send does not break primary API transaction.
2. Every event is traceable in logs.

## 16) Localization Implementation Plan (Kosovo)

Steps:

1. Add i18n dictionary object in frontend (`sq` default, `en` fallback).
2. Use `Europe/Prishtina` for displayed times.
3. Standardize location presets for Kosovo municipalities and Remote.
4. Validate phones with Kosovo-compatible rules.
5. Default salary currency to EUR.
6. Add privacy and terms pages with local expectations and GDPR-style controls.

Acceptance:

1. Language switch works for major user flows.
2. All user-facing dates/currency/locations are localized.

## 17) Security and Reliability Implementation Plan

## 17.1 Security controls

1. Apply `helmet`.
2. Add endpoint rate limiting:
   - auth routes
   - application submit route
3. Use input validators for all mutating endpoints.
4. Sanitize user-provided rich text fields.
5. Use secure cookie settings in production.
6. Add CSRF strategy for cookie-based auth.
7. Enforce file upload limits and MIME checks for CV uploads.

## 17.2 Reliability controls

1. Add request IDs via middleware.
2. Structured logs per request and error.
3. Centralized error handler.
4. Add health endpoint `/api/health`.
5. Add startup checks for required env vars.

Acceptance:

1. Sensitive endpoints protected and validated.
2. Core errors are diagnosable with request trace IDs.

## 18) Moderation and Reporting Feature Implementation

Steps:

1. Add spam/profanity checker for job posts.
2. Add duplicate job detection:
   - simple normalized title + description similarity threshold.
3. Add report actions:
   - seeker reports suspicious jobs
   - employer reports abusive applications
4. Build admin resolution workflow.
5. Persist moderation decisions.

Acceptance:

1. Reports can be submitted and resolved end-to-end.
2. Moderation history available in admin panel.

## 19) Analytics and KPI Implementation Plan

Steps:

1. Define event schema in `analytics_events`.
2. Track:
   - signup conversion by role
   - posting completion rate
   - apply conversion rate
   - time to first application
   - employer response time
   - outcome distribution
3. Create admin reports endpoints and dashboard cards.
4. Add daily aggregate script for summary tables.

Acceptance:

1. KPI cards load from real event data.
2. Metrics can be exported as CSV from admin.

## 20) CV and Document Manager Implementation Plan

Steps:

1. Add `multer` upload endpoint and storage path.
2. Save metadata in DB:
   - file path
   - upload date
   - owner user id
3. Add seeker CV manager UI:
   - upload
   - set default CV
   - delete
4. Add employer download permissions:
   - only for applications tied to employer jobs.

Acceptance:

1. Upload limits enforced.
2. Access control prevents cross-account file access.

## 21) Feature-to-Implementation Coverage Matrix

Every feature in `Platforma_Plan.md` maps as follows:

1. Account model and role separation -> Sections 6, 7, 8, 10
2. Signup split and employer fields -> Section 10
3. Auth/session strategy -> Section 7
4. Landing improvements -> Section 9
5. Apply page improvements -> Section 11
6. Admin split and employer pages -> Sections 13 and 14
7. Job seeker dashboard and applications -> Section 12
8. Employer dashboard/jobs/applications/company settings -> Section 13
9. Email triggers/templates/safety -> Section 15
10. Data model evolution -> Section 6
11. API roadmap implementation -> Section 8
12. UX flow enhancements -> Sections 9, 10, 11, 12, 13
13. Kosovo localization -> Section 16
14. Security and reliability baseline -> Section 17
15. Low-complexity tooling additions -> Sections 5 and 17 and 20
16. Moderation and reporting -> Section 18
17. Analytics and KPIs -> Section 19
18. Phased delivery and DoD -> Sections 22 and 24

## 22) Phase-by-Phase Execution Timeline

## Phase 1 (Weeks 1-3): Foundation and Risk Removal

Deliver:

1. Migration framework and schema upgrades.
2. Password hashing and auth/session system.
3. Role middleware and route protection.
4. Fix legacy critical issues:
   - no auth on admin APIs
   - weak validation
   - incorrect delete behavior
5. Initial role-aware signin flow.
6. Security middleware baseline.

Exit criteria:

1. Role separation enforced at API level.
2. Existing pages still function with auth upgrades.

## Phase 2 (Weeks 4-7): Core Marketplace Flows

Deliver:

1. Employer onboarding and company settings.
2. Employer jobs and applications pages.
3. Job seeker dashboard and applications timeline.
4. Enhanced apply flow with profile prefill and CV support.
5. Status transitions and email notifications.

Exit criteria:

1. Employer can post and manage hiring process end-to-end.
2. Job seeker can apply and track statuses end-to-end.

## Phase 3 (Weeks 8-10): Production Completeness

Deliver:

1. Saved jobs and recommendations.
2. Moderation and reporting system.
3. Analytics dashboards and export.
4. Localization polishing and UX quality pass.
5. Reliability improvements and operational docs.

Exit criteria:

1. Platform meets production-ready baseline from plan.

## 23) Detailed QA and Testing Plan

## 23.1 Automated tests

Add:

1. Unit tests for auth, validation, and status transitions.
2. Integration tests for all critical API routes.
3. Role authorization matrix tests.
4. Email trigger tests (mock transport).

## 23.2 Manual E2E checklists

Run per release:

1. Job seeker registration to hired status flow.
2. Employer registration to first hire flow.
3. Admin moderation flow.
4. Localization checks in Albanian and English.
5. Mobile responsiveness for all pages.

## 23.3 Regression gates

Release only if:

1. All critical API tests pass.
2. No high severity security findings in npm audit.
3. Migration up/down tested on backup DB.

## 24) Definition of Done for Implementation

Complete implementation means all below are true:

1. `job_seeker`, `employer`, and `admin` roles are enforced in DB, API, and UI.
2. Employer email verification is required before posting.
3. Employers can create/manage jobs and candidate statuses from employer pages only.
4. Job seekers can apply quickly, upload/reuse CV, and track application timelines.
5. Notification emails are sent for all defined trigger events and logged.
6. Admin can moderate content and accounts with audit trail.
7. Localization for Kosovo defaults is active.
8. Security baseline controls are live.
9. KPI reporting is available in admin.
10. No dependency on unnecessary high-complexity tooling.

## 25) Immediate Next Execution Actions

1. Approve this implementation blueprint.
2. Start Phase 1 branch and migration framework.
3. Implement auth/session + role middleware.
4. Replace current auth usage in frontend with server-validated session checks.
5. Continue with employer and job seeker portal build in Phase 2 order.
