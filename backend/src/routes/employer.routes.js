import { Router } from 'express';
import { dbClient } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createOrUpdateJobValidator,
  jobIdParamValidator,
  updateJobStatusValidator
} from '../validators/job.validators.js';
import { validateRequest } from '../middleware/validate.js';
import { inviteMemberValidator, updateCompanyValidator } from '../validators/employer.validators.js';
import { updateApplicationStatusValidator } from '../validators/application.validators.js';
import { sanitizeHtml } from '../utils/sanitize.js';
import { sendEmail } from '../services/email.service.js';
import { trackEvent } from '../services/analytics.service.js';

const router = Router();

router.use('/employer', requireAuth, requireRole(ROLES.EMPLOYER, ROLES.ADMIN));

function getEmployerCompanyOrThrow(userId) {
  const company = dbClient.get('SELECT * FROM companies WHERE owner_user_id = ?', [userId]);
  if (!company) {
    const error = new Error('Profili i kompanise nuk u gjet.');
    error.statusCode = 404;
    throw error;
  }
  return company;
}

function parseSkills(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (_error) {
    return [];
  }
}

function getCvDownloadUrl(applicationId, cvFilePath) {
  if (!cvFilePath) {
    return null;
  }

  return `/api/applications/${applicationId}/cv`;
}

router.get('/employer/company', asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);
  return res.json(company);
}));

router.get('/employer/dashboard', asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);

  const activeJobs = dbClient.get(
    "SELECT COUNT(*) AS count FROM jobs WHERE company_id = ? AND status = 'active'",
    [company.id]
  )?.count || 0;

  const pendingReview = dbClient.get(
    "SELECT COUNT(*) AS count FROM applications a INNER JOIN jobs j ON j.id = a.job_id WHERE j.company_id = ? AND a.status IN ('submitted', 'viewed')",
    [company.id]
  )?.count || 0;

  const newApplications = dbClient.get(
    "SELECT COUNT(*) AS count FROM applications a INNER JOIN jobs j ON j.id = a.job_id WHERE j.company_id = ? AND a.applied_at >= DATETIME('now', '-7 day')",
    [company.id]
  )?.count || 0;

  const expiringJobs = dbClient.select(
    `SELECT id, title, deadline_at AS deadlineAt
     FROM jobs
     WHERE company_id = ?
       AND status = 'active'
       AND deadline_at IS NOT NULL
       AND deadline_at <= DATETIME('now', '+7 day')
     ORDER BY deadline_at ASC`,
    [company.id]
  );

  return res.json({
    activeJobs,
    pendingReview,
    newApplications,
    expiringJobs
  });
}));

router.put('/employer/company', updateCompanyValidator, validateRequest, asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);

  dbClient.run(
    `UPDATE companies
     SET name = ?, legal_name = ?, email = ?, phone = ?, city = ?, website = ?, description = ?, notification_email = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      req.body.name,
      req.body.legalName || null,
      req.body.email,
      req.body.phone || null,
      req.body.city || null,
      req.body.website || null,
      req.body.description || null,
      req.body.notificationEmail || req.body.email,
      company.id
    ]
  );

  const updated = dbClient.get('SELECT * FROM companies WHERE id = ?', [company.id]);
  return res.json({ success: true, message: 'Profili i kompanise u perditesua.', company: updated });
}));

router.get('/employer/jobs', asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);

  const rows = dbClient.select(
    `SELECT
      j.id,
      j.title,
      j.status,
      j.location,
      j.positions,
      j.created_at AS createdAt,
      j.deadline_at AS deadlineAt,
      COUNT(a.id) AS applicationsCount
     FROM jobs j
     LEFT JOIN applications a ON a.job_id = j.id
     WHERE j.company_id = ?
     GROUP BY j.id
     ORDER BY j.created_at DESC`,
    [company.id]
  );

  return res.json(rows);
}));

router.post('/employer/jobs', createOrUpdateJobValidator, validateRequest, asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);

  if (Number(req.user.isEmailVerified) !== 1 || Number(company.is_verified) !== 1) {
    return res.status(403).json({
      success: false,
      message: 'Email-i i kompanise duhet te verifikohet para publikimit te shpalljeve.'
    });
  }

  const requiredSkills = JSON.stringify(parseSkills(req.body.requiredSkills));
  const description = sanitizeHtml(req.body.description);

  const result = dbClient.run(
    `INSERT INTO jobs
     (title, company, company_id, location, positions, is_new, description, employment_type, experience_level, deadline_at, status, salary_min, salary_max, currency, required_skills_json, work_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.body.title,
      company.name,
      company.id,
      req.body.location || 'Prishtine',
      Number(req.body.positions || 1),
      1,
      description,
      req.body.employmentType || 'full_time',
      req.body.experienceLevel || 'entry',
      req.body.deadlineAt || null,
      req.body.status || 'active',
      req.body.salaryMin || null,
      req.body.salaryMax || null,
      req.body.currency || 'EUR',
      requiredSkills,
      req.body.workMode || 'onsite'
    ]
  );

  trackEvent({
    userId: req.user.id,
    role: req.user.role,
    eventKey: 'job_created',
    eventValue: String(result.lastInsertId)
  });

  return res.json({
    success: true,
    message: 'Shpallja u krijua me sukses.',
    jobId: result.lastInsertId
  });
}));

router.put('/employer/jobs/:id', jobIdParamValidator, createOrUpdateJobValidator, validateRequest, asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);
  const job = dbClient.get('SELECT id FROM jobs WHERE id = ? AND company_id = ?', [req.params.id, company.id]);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Shpallja nuk u gjet.' });
  }

  const requiredSkills = JSON.stringify(parseSkills(req.body.requiredSkills));
  const description = sanitizeHtml(req.body.description);

  dbClient.run(
    `UPDATE jobs
     SET title = ?, location = ?, positions = ?, description = ?, employment_type = ?, experience_level = ?,
         deadline_at = ?, status = ?, salary_min = ?, salary_max = ?, currency = ?, required_skills_json = ?, work_mode = ?
     WHERE id = ? AND company_id = ?`,
    [
      req.body.title,
      req.body.location || 'Prishtine',
      Number(req.body.positions || 1),
      description,
      req.body.employmentType || 'full_time',
      req.body.experienceLevel || 'entry',
      req.body.deadlineAt || null,
      req.body.status || 'active',
      req.body.salaryMin || null,
      req.body.salaryMax || null,
      req.body.currency || 'EUR',
      requiredSkills,
      req.body.workMode || 'onsite',
      req.params.id,
      company.id
    ]
  );

  trackEvent({
    userId: req.user.id,
    role: req.user.role,
    eventKey: 'job_updated',
    eventValue: String(req.params.id)
  });

  return res.json({ success: true, message: 'Shpallja u perditesua me sukses.' });
}));

router.patch('/employer/jobs/:id/status', updateJobStatusValidator, validateRequest, asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);
  const job = dbClient.get('SELECT id FROM jobs WHERE id = ? AND company_id = ?', [req.params.id, company.id]);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Shpallja nuk u gjet.' });
  }

  dbClient.run('UPDATE jobs SET status = ? WHERE id = ? AND company_id = ?', [req.body.status, req.params.id, company.id]);
  trackEvent({
    userId: req.user.id,
    role: req.user.role,
    eventKey: 'job_status_changed',
    eventValue: String(req.params.id),
    metadata: { status: req.body.status }
  });
  return res.json({ success: true, message: 'Statusi i shpalljes u ndryshua.' });
}));

router.post('/employer/jobs/:id/duplicate', jobIdParamValidator, validateRequest, asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);
  const job = dbClient.get('SELECT * FROM jobs WHERE id = ? AND company_id = ?', [req.params.id, company.id]);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Shpallja nuk u gjet.' });
  }

  const result = dbClient.run(
    `INSERT INTO jobs
     (title, company, company_id, location, positions, is_new, description, employment_type, experience_level, deadline_at, status, salary_min, salary_max, currency, required_skills_json, work_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `${job.title} (Copy)`,
      job.company,
      job.company_id,
      job.location,
      job.positions,
      1,
      job.description,
      job.employment_type,
      job.experience_level,
      job.deadline_at,
      'draft',
      job.salary_min,
      job.salary_max,
      job.currency,
      job.required_skills_json,
      job.work_mode
    ]
  );

  trackEvent({
    userId: req.user.id,
    role: req.user.role,
    eventKey: 'job_duplicated',
    eventValue: String(req.params.id),
    metadata: { duplicateId: result.lastInsertId }
  });

  return res.json({ success: true, message: 'Shpallja u duplikua me sukses.', jobId: result.lastInsertId });
}));

router.delete('/employer/jobs/:id', jobIdParamValidator, validateRequest, asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);
  const job = dbClient.get(
    'SELECT id, title FROM jobs WHERE id = ? AND company_id = ?',
    [req.params.id, company.id]
  );

  if (!job) {
    return res.status(404).json({ success: false, message: 'Shpallja nuk u gjet.' });
  }

  // Koment: Fshirje e plote e shpalljes bashke me aplikimet dhe records te lidhura.
  dbClient.transaction((trx) => {
    trx.run(
      'DELETE FROM application_notes WHERE application_id IN (SELECT id FROM applications WHERE job_id = ?)',
      [job.id]
    );
    trx.run(
      'DELETE FROM application_status_history WHERE application_id IN (SELECT id FROM applications WHERE job_id = ?)',
      [job.id]
    );
    trx.run('DELETE FROM applications WHERE job_id = ?', [job.id]);
    trx.run('DELETE FROM saved_jobs WHERE job_id = ?', [job.id]);
    trx.run('DELETE FROM report_flags WHERE target_type = ? AND target_id = ?', ['job', job.id]);
    trx.run('DELETE FROM jobs WHERE id = ? AND company_id = ?', [job.id, company.id]);
  });

  trackEvent({
    userId: req.user.id,
    role: req.user.role,
    eventKey: 'job_deleted',
    eventValue: String(job.id)
  });

  return res.json({ success: true, message: 'Shpallja u fshi me sukses.' });
}));

router.get('/employer/jobs/:id/applications', jobIdParamValidator, validateRequest, asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);
  const job = dbClient.get('SELECT id FROM jobs WHERE id = ? AND company_id = ?', [req.params.id, company.id]);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Shpallja nuk u gjet.' });
  }

  const apps = dbClient.select(
    `SELECT
      a.id,
      a.reference_code AS referenceCode,
      a.full_name AS fullName,
      a.email,
      a.phone,
      a.city,
      a.status,
      a.applied_at AS appliedAt,
      a.cover_letter AS coverLetter,
      a.cv_file_path AS cvFilePath,
      a.job_title AS jobTitle,
      u.id AS userId,
      p.skills_json AS skills,
      p.experience_json AS experience
     FROM applications a
     LEFT JOIN users u ON u.id = a.job_seeker_user_id
     LEFT JOIN job_seeker_profiles p ON p.user_id = u.id
     WHERE a.job_id = ?
     ORDER BY a.applied_at DESC`,
    [req.params.id]
  );

  return res.json(apps.map((app) => ({
    ...app,
    cvDownloadUrl: getCvDownloadUrl(app.id, app.cvFilePath),
    skills: parseSkills(app.skills),
    experience: parseSkills(app.experience)
  })));
}));

router.get('/employer/applications', asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);

  const apps = dbClient.select(
    `SELECT
      a.id,
      a.reference_code AS referenceCode,
      a.full_name AS fullName,
      a.email,
      a.phone,
      a.city,
      a.status,
      a.applied_at AS appliedAt,
      a.cover_letter AS coverLetter,
      a.cv_file_path AS cvFilePath,
      a.job_title AS jobTitle,
      j.id AS jobId,
      j.title,
      j.location
     FROM applications a
     INNER JOIN jobs j ON j.id = a.job_id
     WHERE j.company_id = ?
     ORDER BY a.applied_at DESC`,
    [company.id]
  );

  return res.json(apps.map((app) => ({
    ...app,
    cvDownloadUrl: getCvDownloadUrl(app.id, app.cvFilePath)
  })));
}));

router.patch('/employer/applications/:id/status', updateApplicationStatusValidator, validateRequest, asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);

  const app = dbClient.get(
    `SELECT
      a.id,
      a.status,
      a.email,
      a.full_name AS fullName,
      a.job_title AS jobTitle
     FROM applications a
     INNER JOIN jobs j ON j.id = a.job_id
     WHERE a.id = ? AND j.company_id = ?`,
    [req.params.id, company.id]
  );

  if (!app) {
    return res.status(404).json({ success: false, message: 'Aplikimi nuk u gjet.' });
  }

  if (app.status === req.body.status) {
    return res.json({ success: true, message: 'Statusi është tashmë i njëjtë.' });
  }

  dbClient.transaction((trx) => {
    trx.run(
      'UPDATE applications SET status = ?, status_updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.body.status, app.id]
    );

    trx.run(
      'INSERT INTO application_status_history (application_id, old_status, new_status, changed_by_user_id, note) VALUES (?, ?, ?, ?, ?)',
      [app.id, app.status, req.body.status, req.user.id, req.body.note || null]
    );
  });

  const templateByStatus = {
    shortlisted: 'status_changed_shortlisted',
    interview: 'status_changed_interview',
    rejected: 'status_changed_rejected',
    hired: 'status_changed_hired'
  };

  const templateKey = templateByStatus[req.body.status];
  if (templateKey) {
    await sendEmail({
      recipient: app.email,
      templateKey,
      relatedEntity: `applications:${app.id}`,
      payload: {
        fullName: app.fullName,
        jobTitle: app.jobTitle,
        companyName: company.name,
        status: req.body.status
      }
    });
  }

  trackEvent({
    userId: req.user.id,
    role: req.user.role,
    eventKey: 'application_status_changed',
    eventValue: String(app.id),
    metadata: { status: req.body.status }
  });

  return res.json({ success: true, message: 'Statusi i aplikimit u perditesua.' });
}));

router.post('/employer/applications/:id/note', asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);
  const note = String(req.body.note || '').trim();

  if (!note) {
    return res.status(400).json({ success: false, message: 'Shenimi nuk mund te jete bosh.' });
  }

  const app = dbClient.get(
    `SELECT a.id
     FROM applications a
     INNER JOIN jobs j ON j.id = a.job_id
     WHERE a.id = ? AND j.company_id = ?`,
    [req.params.id, company.id]
  );

  if (!app) {
    return res.status(404).json({ success: false, message: 'Aplikimi nuk u gjet.' });
  }

  dbClient.run(
    'INSERT INTO application_notes (application_id, author_user_id, note) VALUES (?, ?, ?)',
    [app.id, req.user.id, note]
  );

  return res.json({ success: true, message: 'Shenimi u ruajt me sukses.' });
}));

router.get('/employer/applications/export.csv', asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);

  const rows = dbClient.select(
    `SELECT
      a.reference_code AS referenceCode,
      a.full_name AS fullName,
      a.email,
      a.phone,
      a.city,
      a.job_title AS jobTitle,
      a.status,
      a.applied_at AS appliedAt
     FROM applications a
     INNER JOIN jobs j ON j.id = a.job_id
     WHERE j.company_id = ?
     ORDER BY a.applied_at DESC`,
    [company.id]
  );

  const csv = toCsv(rows, ['referenceCode', 'fullName', 'email', 'phone', 'city', 'jobTitle', 'status', 'appliedAt']);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="applications.csv"');
  return res.send(csv);
}));

router.post('/employer/members/invite', inviteMemberValidator, validateRequest, asyncHandler(async (req, res) => {
  const company = getEmployerCompanyOrThrow(req.user.id);
  const inviteEmail = String(req.body.email || '').trim().toLowerCase();
  const memberRole = req.body.memberRole || 'recruiter';

  const user = dbClient.get('SELECT id FROM users WHERE email = ?', [inviteEmail]);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Nuk ekziston llogari me këtë email. Perdoruesi duhet te regjistrohet fillimisht.'
    });
  }

  dbClient.run(
    'INSERT OR IGNORE INTO employer_members (company_id, user_id, member_role) VALUES (?, ?, ?)',
    [company.id, user.id, memberRole]
  );

  return res.json({ success: true, message: 'Ftesa e anetarit u ruajt me sukses.' });
}));

function toCsv(rows, fields) {
  const escape = (value) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };

  const header = fields.map(escape).join(',');
  const body = rows.map((row) => fields.map((field) => escape(row[field])).join(',')).join('\n');
  return `${header}\n${body}`;
}

export default router;
