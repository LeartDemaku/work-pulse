import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { nanoid } from 'nanoid';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';
import { dbClient } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  applyValidator,
  listJobSeekerApplicationsValidator,
  withdrawApplicationValidator
} from '../validators/application.validators.js';
import { validateRequest } from '../middleware/validate.js';
import { sendEmail } from '../services/email.service.js';
import { cvUpload } from '../middleware/upload.js';
import { trackEvent } from '../services/analytics.service.js';
import { env, getBackendRoot } from '../config/env.js';

const router = Router();

const applyLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.APPLY_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Shume aplikime ne kohe të shkurtër. Provoni perseri pas pak.'
  }
});

const backendRoot = getBackendRoot();
const cvUploadRoot = path.resolve(backendRoot, 'uploads/cv');

function normalizeStoredCvPath(rawPath) {
  const normalized = String(rawPath || '').replace(/\\/g, '/').trim();
  if (!normalized) {
    return null;
  }

  const marker = '/uploads/cv/';
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex >= 0) {
    const suffix = normalized.slice(markerIndex + marker.length);
    return suffix ? `uploads/cv/${suffix}` : null;
  }

  const filename = path.basename(normalized);
  return filename ? `uploads/cv/${filename}` : null;
}

function resolveStoredCvAbsolutePath(storedPath) {
  const normalized = String(storedPath || '').replace(/\\/g, '/').trim();
  if (!normalized) {
    return null;
  }

  if (path.isAbsolute(normalized)) {
    return path.normalize(normalized);
  }

  if (normalized.startsWith('uploads/')) {
    return path.resolve(backendRoot, normalized);
  }

  if (normalized.startsWith('/uploads/')) {
    return path.resolve(backendRoot, normalized.slice(1));
  }

  const marker = 'backend/uploads/cv/';
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex >= 0) {
    const suffix = normalized.slice(markerIndex + marker.length);
    return path.resolve(cvUploadRoot, suffix);
  }

  return path.resolve(cvUploadRoot, path.basename(normalized));
}

function isInsideCvUploadRoot(filePath) {
  const relative = path.relative(cvUploadRoot, filePath);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function getCvDownloadUrl(applicationId, cvFilePath) {
  if (!cvFilePath) {
    return null;
  }
  return `/api/applications/${applicationId}/cv`;
}

function removeFileIfExists(filePath) {
  if (!filePath || !existsSync(filePath)) {
    return;
  }

  try {
    unlinkSync(filePath);
  } catch (_error) {
    // Koment: Deshtimi i fshirjes se file-it nuk duhet te bllokoje request-in.
  }
}

router.post(
  '/applications',
  applyLimiter,
  requireAuth,
  requireRole(ROLES.JOB_SEEKER),
  cvUpload.single('cv'),
  applyValidator,
  validateRequest,
  asyncHandler(async (req, res) => {
    let persistedApplicationId = null;
    const cleanupUploadedCv = () => {
      if (persistedApplicationId) {
        return;
      }
      removeFileIfExists(req.file?.path);
    };

    try {
      const { jobId, fullName, email, phone, city, coverLetter } = req.body;

    const job = dbClient.get(
      `SELECT
        j.id,
        j.title,
        j.status,
        j.company_id AS companyId,
        COALESCE(c.notification_email, c.email) AS notificationEmail,
        c.name AS companyName
      FROM jobs j
      LEFT JOIN companies c ON c.id = j.company_id
      WHERE j.id = ?`,
      [jobId]
    );

    if (!job || job.status !== 'active') {
      cleanupUploadedCv();
      return res.status(404).json({ success: false, message: 'Puna nuk është aktive ose nuk ekziston.' });
    }

    const existing = dbClient.get(
      "SELECT id FROM applications WHERE job_id = ? AND job_seeker_user_id = ? AND status NOT IN ('withdrawn')",
      [jobId, req.user.id]
    );

    if (existing) {
      cleanupUploadedCv();
      return res.status(409).json({ success: false, message: 'Ju tashmë keni aplikuar për këtë pozite.' });
    }

    const referenceCode = `APL-${nanoid(8).toUpperCase()}`;
    const cvPath = req.file ? normalizeStoredCvPath(req.file.path) : null;

    const result = dbClient.run(
      `INSERT INTO applications
      (full_name, email, phone, city, job_title, job_id, job_seeker_user_id, status, status_updated_at, cover_letter, cv_file_path, source, reference_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)`,
      [
        fullName,
        email,
        phone,
        city,
        job.title,
        jobId,
        req.user.id,
        'submitted',
        coverLetter || null,
        cvPath,
        'web',
        referenceCode
      ]
    );
    persistedApplicationId = result.lastInsertId;

    dbClient.run(
      'INSERT INTO application_status_history (application_id, old_status, new_status, changed_by_user_id, note) VALUES (?, ?, ?, ?, ?)',
      [result.lastInsertId, null, 'submitted', req.user.id, 'Aplikimi u krijua']
    );

    await sendEmail({
      recipient: email,
      templateKey: 'application_received',
      relatedEntity: `applications:${result.lastInsertId}`,
      payload: {
        fullName,
        jobTitle: job.title,
        companyName: job.companyName
      }
    });

    if (job.notificationEmail) {
      await sendEmail({
        recipient: job.notificationEmail,
        templateKey: 'new_application_received',
        relatedEntity: `applications:${result.lastInsertId}`,
        payload: {
          fullName,
          jobTitle: job.title,
          companyName: job.companyName
        }
      });
    }

    trackEvent({
      userId: req.user.id,
      role: req.user.role,
      eventKey: 'application_submitted',
      eventValue: String(jobId),
      metadata: { referenceCode, companyId: job.companyId }
    });

      return res.json({
        success: true,
        message: 'Aplikimi u dergua me sukses.',
        applicationId: result.lastInsertId,
        referenceCode,
        cvDownloadUrl: getCvDownloadUrl(result.lastInsertId, cvPath)
      });
    } catch (error) {
      cleanupUploadedCv();
      throw error;
    }
  })
);

router.get(
  '/applications/:id/cv',
  requireAuth,
  asyncHandler(async (req, res) => {
    const app = dbClient.get(
      `SELECT
        a.id,
        a.cv_file_path AS cvFilePath,
        a.job_seeker_user_id AS jobSeekerUserId,
        c.owner_user_id AS companyOwnerUserId,
        EXISTS(
          SELECT 1
          FROM employer_members em
          WHERE em.company_id = j.company_id AND em.user_id = ?
        ) AS isCompanyMember
       FROM applications a
       INNER JOIN jobs j ON j.id = a.job_id
       LEFT JOIN companies c ON c.id = j.company_id
       WHERE a.id = ?`,
      [req.user.id, req.params.id]
    );

    if (!app) {
      return res.status(404).json({ success: false, message: 'Aplikimi nuk u gjet.' });
    }

    if (!app.cvFilePath) {
      return res.status(404).json({ success: false, message: 'Ky aplikim nuk ka CV te ngarkuar.' });
    }

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isJobSeekerOwner = req.user.role === ROLES.JOB_SEEKER && Number(app.jobSeekerUserId) === Number(req.user.id);
    const isEmployerOwner = Number(app.companyOwnerUserId) === Number(req.user.id);
    const isEmployerMember = Number(app.isCompanyMember) === 1;
    const isEmployerAuthorized = req.user.role === ROLES.EMPLOYER && (isEmployerOwner || isEmployerMember);

    if (!isAdmin && !isJobSeekerOwner && !isEmployerAuthorized) {
      return res.status(403).json({ success: false, message: 'Nuk keni te drejta per te pare kete CV.' });
    }

    const absolutePath = resolveStoredCvAbsolutePath(app.cvFilePath);
    if (!absolutePath || !isInsideCvUploadRoot(absolutePath) || !existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'CV-ja nuk u gjet ne ruajtje.' });
    }

    res.setHeader('Content-Disposition', `inline; filename="${path.basename(absolutePath)}"`);
    return res.sendFile(absolutePath);
  })
);

router.get(
  '/jobseeker/applications',
  requireAuth,
  requireRole(ROLES.JOB_SEEKER),
  listJobSeekerApplicationsValidator,
  validateRequest,
  asyncHandler(async (req, res) => {
    const where = ['a.job_seeker_user_id = ?'];
    const params = [req.user.id];

    if (req.query.status) {
      where.push('a.status = ?');
      params.push(req.query.status);
    }

    if (req.query.from) {
      where.push('a.applied_at >= ?');
      params.push(req.query.from);
    }

    if (req.query.to) {
      where.push('a.applied_at <= ?');
      params.push(req.query.to);
    }

    const applications = dbClient.select(
      `SELECT
        a.id,
        a.reference_code AS referenceCode,
        a.job_title AS jobTitle,
        a.status,
        a.applied_at AS appliedAt,
        a.status_updated_at AS statusUpdatedAt,
        a.cover_letter AS coverLetter,
        a.cv_file_path AS cvFilePath,
        j.company,
        j.location,
        j.deadline_at AS deadlineAt
      FROM applications a
      LEFT JOIN jobs j ON j.id = a.job_id
      WHERE ${where.join(' AND ')}
      ORDER BY a.applied_at DESC`,
      params
    );

    const withTimeline = applications.map((app) => {
      const timeline = dbClient.select(
        `SELECT old_status AS oldStatus, new_status AS newStatus, note, changed_at AS changedAt
         FROM application_status_history
         WHERE application_id = ?
         ORDER BY changed_at ASC`,
        [app.id]
      );

      return {
        ...app,
        cvDownloadUrl: getCvDownloadUrl(app.id, app.cvFilePath),
        timeline
      };
    });

    return res.json(withTimeline);
  })
);

router.patch(
  '/jobseeker/applications/:id/withdraw',
  requireAuth,
  requireRole(ROLES.JOB_SEEKER),
  withdrawApplicationValidator,
  validateRequest,
  asyncHandler(async (req, res) => {
    const app = dbClient.get(
      'SELECT id, status, job_title AS jobTitle FROM applications WHERE id = ? AND job_seeker_user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!app) {
      return res.status(404).json({ success: false, message: 'Aplikimi nuk u gjet.' });
    }

    const blocked = ['interview', 'offer', 'hired'];
    if (blocked.includes(app.status)) {
      return res.status(409).json({ success: false, message: 'Ky aplikim nuk mund të tërhiqet në këtë fazë.' });
    }

    if (app.status === 'withdrawn') {
      return res.json({ success: true, message: 'Aplikimi është tërhequr tashmë.' });
    }

    dbClient.transaction((trx) => {
      trx.run(
        'UPDATE applications SET status = ?, status_updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['withdrawn', app.id]
      );

      trx.run(
        'INSERT INTO application_status_history (application_id, old_status, new_status, changed_by_user_id, note) VALUES (?, ?, ?, ?, ?)',
        [app.id, app.status, 'withdrawn', req.user.id, 'Aplikimi u tërhoq nga kandidati']
      );
    });

    trackEvent({
      userId: req.user.id,
      role: req.user.role,
      eventKey: 'application_withdrawn',
      eventValue: String(app.id)
    });

    return res.json({ success: true, message: 'Aplikimi u terhoq me sukses.' });
  })
);

router.post(
  '/jobseeker/saved-jobs',
  requireAuth,
  requireRole(ROLES.JOB_SEEKER),
  asyncHandler(async (req, res) => {
    const jobId = Number(req.body.jobId || 0);
    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId është i detyrueshëm.' });
    }

    dbClient.run(
      'INSERT OR IGNORE INTO saved_jobs (job_id, job_seeker_user_id) VALUES (?, ?)',
      [jobId, req.user.id]
    );

    return res.json({ success: true, message: 'Puna u ruajt me sukses.' });
  })
);

router.get(
  '/jobseeker/saved-jobs',
  requireAuth,
  requireRole(ROLES.JOB_SEEKER),
  asyncHandler(async (req, res) => {
    const rows = dbClient.select(
      `SELECT
        j.id,
        j.title,
        j.company,
        j.location,
        s.saved_at AS savedAt
       FROM saved_jobs s
       INNER JOIN jobs j ON j.id = s.job_id
       WHERE s.job_seeker_user_id = ?
       ORDER BY s.saved_at DESC`,
      [req.user.id]
    );

    return res.json(rows);
  })
);

router.delete(
  '/jobseeker/saved-jobs/:jobId',
  requireAuth,
  requireRole(ROLES.JOB_SEEKER),
  asyncHandler(async (req, res) => {
    dbClient.run('DELETE FROM saved_jobs WHERE job_id = ? AND job_seeker_user_id = ?', [req.params.jobId, req.user.id]);
    return res.json({ success: true, message: 'Puna u hoq nga te ruajturat.' });
  })
);

router.get(
  '/jobseeker/recommendations',
  requireAuth,
  requireRole(ROLES.JOB_SEEKER),
  asyncHandler(async (req, res) => {
    const profile = dbClient.get('SELECT skills_json AS skills FROM job_seeker_profiles WHERE user_id = ?', [req.user.id]);
    const skills = safeParse(profile?.skills, []);

    if (!skills.length) {
      const latest = dbClient.select("SELECT id, title, company, location FROM jobs WHERE status = 'active' ORDER BY created_at DESC LIMIT 10");
      return res.json(latest);
    }

    const tokens = skills.slice(0, 5).map((skill) => `%${String(skill).toLowerCase()}%`);
    const where = tokens.map(() => '(LOWER(title) LIKE ? OR LOWER(required_skills_json) LIKE ?)').join(' OR ');
    const params = tokens.flatMap((token) => [token, token]);

    const rows = dbClient.select(
      `SELECT id, title, company, location, required_skills_json AS requiredSkills
       FROM jobs
       WHERE status = 'active' AND (${where})
       ORDER BY created_at DESC
       LIMIT 20`,
      params
    );

    return res.json(rows.map((row) => ({
      ...row,
      requiredSkills: safeParse(row.requiredSkills, [])
    })));
  })
);

function safeParse(value, fallback) {
  try {
    if (!value) {
      return fallback;
    }
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

export default router;

