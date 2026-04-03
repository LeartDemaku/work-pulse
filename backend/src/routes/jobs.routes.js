import { Router } from 'express';
import { dbClient } from '../db/client.js';
import { asyncHandler } from '../utils/async-handler.js';
import { jobIdParamValidator, listJobsValidator } from '../validators/job.validators.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

function buildWhereClause(query) {
  const where = ['status = ?'];
  const params = ['active'];

  if (query.search) {
    where.push('(title LIKE ? OR company LIKE ? OR location LIKE ?)');
    const value = `%${query.search.trim()}%`;
    params.push(value, value, value);
  }

  if (query.location) {
    where.push('location = ?');
    params.push(query.location);
  }

  if (query.employmentType) {
    where.push('employment_type = ?');
    params.push(query.employmentType);
  }

  if (query.experienceLevel) {
    where.push('experience_level = ?');
    params.push(query.experienceLevel);
  }

  if (query.workMode) {
    where.push('work_mode = ?');
    params.push(query.workMode);
  }

  return { whereSql: where.join(' AND '), params };
}

router.get('/jobs', listJobsValidator, validateRequest, asyncHandler(async (req, res) => {
  const { whereSql, params } = buildWhereClause(req.query);

  const jobs = dbClient.select(
    `SELECT
      j.id,
      j.title,
      j.company,
      j.location,
      j.positions,
      j.is_new AS isNew,
      j.description,
      j.created_at AS createdAt,
      j.deadline_at AS deadlineAt,
      j.employment_type AS employmentType,
      j.experience_level AS experienceLevel,
      j.work_mode AS workMode,
      j.salary_min AS salaryMin,
      j.salary_max AS salaryMax,
      j.currency,
      j.required_skills_json AS requiredSkills,
      c.id AS companyId,
      c.name AS companyName,
      c.is_verified AS companyVerified
    FROM jobs j
    LEFT JOIN companies c ON c.id = j.company_id
    WHERE ${whereSql}
    ORDER BY j.created_at DESC`,
    params
  );

  return res.json(jobs.map((job) => ({
    ...job,
    isNew: Number(job.isNew) === 1,
    companyVerified: Number(job.companyVerified) === 1,
    requiredSkills: safeParseJson(job.requiredSkills, [])
  })));
}));

router.get('/jobs/:id', jobIdParamValidator, validateRequest, asyncHandler(async (req, res) => {
  const job = dbClient.get(
    `SELECT
      j.id,
      j.title,
      j.company,
      j.location,
      j.positions,
      j.description,
      j.created_at AS createdAt,
      j.deadline_at AS deadlineAt,
      j.employment_type AS employmentType,
      j.experience_level AS experienceLevel,
      j.work_mode AS workMode,
      j.salary_min AS salaryMin,
      j.salary_max AS salaryMax,
      j.currency,
      j.required_skills_json AS requiredSkills,
      c.id AS companyId,
      c.name AS companyName,
      c.description AS companyDescription,
      c.website AS companyWebsite,
      c.is_verified AS companyVerified
    FROM jobs j
    LEFT JOIN companies c ON c.id = j.company_id
    WHERE j.id = ? AND j.status = 'active'`,
    [req.params.id]
  );

  if (!job) {
    return res.status(404).json({ success: false, message: 'Puna nuk u gjet.' });
  }

  return res.json({
    ...job,
    companyVerified: Number(job.companyVerified) === 1,
    requiredSkills: safeParseJson(job.requiredSkills, [])
  });
}));

router.get('/public/stats', asyncHandler(async (_req, res) => {
  const activeJobs = dbClient.get("SELECT COUNT(*) AS count FROM jobs WHERE status = 'active'")?.count || 0;
  const companies = dbClient.get('SELECT COUNT(*) AS count FROM companies')?.count || 0;
  const applicationsThisMonth = dbClient.get(
    "SELECT COUNT(*) AS count FROM applications WHERE strftime('%Y-%m', applied_at) = strftime('%Y-%m', 'now')"
  )?.count || 0;

  return res.json({
    activeJobs,
    companies,
    applicationsThisMonth
  });
}));

function safeParseJson(value, fallback) {
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