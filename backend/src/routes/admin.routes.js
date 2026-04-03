import { Router } from 'express';
import { dbClient } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/async-handler.js';
import { moderationStatusValidator, resolveReportValidator, userStatusValidator } from '../validators/admin.validators.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

router.use('/admin', requireAuth, requireRole(ROLES.ADMIN));

router.get('/admin/reports', asyncHandler(async (_req, res) => {
  const totalUsers = dbClient.get('SELECT COUNT(*) AS count FROM users')?.count || 0;
  const totalJobs = dbClient.get('SELECT COUNT(*) AS count FROM jobs')?.count || 0;
  const activeJobs = dbClient.get("SELECT COUNT(*) AS count FROM jobs WHERE status = 'active'")?.count || 0;
  const totalApplications = dbClient.get('SELECT COUNT(*) AS count FROM applications')?.count || 0;
  const openReports = dbClient.get("SELECT COUNT(*) AS count FROM report_flags WHERE status = 'open'")?.count || 0;

  const applicationsByStatus = dbClient.select(
    'SELECT status, COUNT(*) AS count FROM applications GROUP BY status ORDER BY count DESC'
  );

  const signupsByRole = dbClient.select(
    'SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY count DESC'
  );

  return res.json({
    totals: {
      totalUsers,
      totalJobs,
      activeJobs,
      totalApplications,
      openReports
    },
    applicationsByStatus,
    signupsByRole
  });
}));

router.get('/admin/users', asyncHandler(async (_req, res) => {
  const users = dbClient.select(
    `SELECT
      id,
      name,
      email,
      role,
      status,
      is_email_verified AS isEmailVerified,
      created_at AS createdAt,
      last_login_at AS lastLoginAt
     FROM users
     ORDER BY created_at DESC`
  );

  return res.json(users);
}));

router.get('/admin/jobs', asyncHandler(async (_req, res) => {
  const jobs = dbClient.select(
    `SELECT
      id,
      title,
      company,
      location,
      status,
      created_at AS createdAt,
      deadline_at AS deadlineAt
     FROM jobs
     ORDER BY created_at DESC`
  );

  return res.json(jobs);
}));

router.patch('/admin/users/:id/status', userStatusValidator, validateRequest, asyncHandler(async (req, res) => {
  const user = dbClient.get('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Perdoruesi nuk u gjet.' });
  }

  dbClient.run('UPDATE users SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  dbClient.run(
    'INSERT INTO moderation_actions (admin_user_id, target_type, target_id, action, notes) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, 'user', req.params.id, 'status_change', `Statusi u vendos ne ${req.body.status}`]
  );

  return res.json({ success: true, message: 'Statusi i perdoruesit u perditesua.' });
}));

router.patch('/admin/jobs/:id/moderation-status', moderationStatusValidator, validateRequest, asyncHandler(async (req, res) => {
  const job = dbClient.get('SELECT id FROM jobs WHERE id = ?', [req.params.id]);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Shpallja nuk u gjet.' });
  }

  let newStatus = 'active';
  if (req.body.status === 'paused') {
    newStatus = 'paused';
  }
  if (req.body.status === 'removed') {
    newStatus = 'archived';
  }

  dbClient.run('UPDATE jobs SET status = ? WHERE id = ?', [newStatus, req.params.id]);
  dbClient.run(
    'INSERT INTO moderation_actions (admin_user_id, target_type, target_id, action, notes) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, 'job', req.params.id, 'moderation_status', `Moderim: ${req.body.status}`]
  );

  return res.json({ success: true, message: 'Statusi i moderimit u perditesua.' });
}));

router.get('/admin/report-flags', asyncHandler(async (_req, res) => {
  const rows = dbClient.select(
    `SELECT
      rf.id,
      rf.reporter_user_id AS reporterUserId,
      u.email AS reporterEmail,
      rf.target_type AS targetType,
      rf.target_id AS targetId,
      rf.reason,
      rf.status,
      rf.created_at AS createdAt,
      rf.resolved_at AS resolvedAt,
      rf.resolved_by_user_id AS resolvedByUserId
    FROM report_flags rf
    LEFT JOIN users u ON u.id = rf.reporter_user_id
    ORDER BY rf.created_at DESC`
  );

  return res.json(rows);
}));

router.post('/admin/report-flags/:id/resolve', resolveReportValidator, validateRequest, asyncHandler(async (req, res) => {
  const report = dbClient.get('SELECT id FROM report_flags WHERE id = ?', [req.params.id]);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Raporti nuk u gjet.' });
  }

  dbClient.run(
    'UPDATE report_flags SET status = ?, resolved_at = CURRENT_TIMESTAMP, resolved_by_user_id = ? WHERE id = ?',
    ['resolved', req.user.id, req.params.id]
  );

  dbClient.run(
    'INSERT INTO moderation_actions (admin_user_id, target_type, target_id, action, notes) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, 'report_flag', req.params.id, 'resolve', req.body.resolution || null]
  );

  return res.json({ success: true, message: 'Raporti u mbyll me sukses.' });
}));

export default router;
