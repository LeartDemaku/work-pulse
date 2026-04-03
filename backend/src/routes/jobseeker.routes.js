import { Router } from 'express';
import { body } from 'express-validator';
import { dbClient } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

const profileValidator = [
  body('headline').optional({ values: 'falsy' }).trim().isLength({ max: 180 }),
  body('city').optional({ values: 'falsy' }).trim().isLength({ max: 80 }),
  body('about').optional({ values: 'falsy' }).trim().isLength({ max: 2500 }),
  body('skills').optional({ values: 'falsy' }).isArray({ max: 80 }),
  body('experience').optional({ values: 'falsy' }).isArray({ max: 50 }),
  body('education').optional({ values: 'falsy' }).isArray({ max: 50 }),
  body('languages').optional({ values: 'falsy' }).isArray({ max: 20 })
];

router.get('/jobseeker/profile', requireAuth, requireRole(ROLES.JOB_SEEKER), asyncHandler(async (req, res) => {
  const profile = dbClient.get(
    `SELECT
      id,
      user_id AS userId,
      headline,
      city,
      skills_json AS skills,
      experience_json AS experience,
      education_json AS education,
      languages_json AS languages,
      about,
      profile_completion AS profileCompletion,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM job_seeker_profiles
    WHERE user_id = ?`,
    [req.user.id]
  );

  if (!profile) {
    dbClient.run('INSERT INTO job_seeker_profiles (user_id) VALUES (?)', [req.user.id]);
  }

  const refreshed = dbClient.get(
    `SELECT
      id,
      user_id AS userId,
      headline,
      city,
      skills_json AS skills,
      experience_json AS experience,
      education_json AS education,
      languages_json AS languages,
      about,
      profile_completion AS profileCompletion,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM job_seeker_profiles
    WHERE user_id = ?`,
    [req.user.id]
  );

  return res.json({
    ...refreshed,
    skills: safeParse(refreshed.skills, []),
    experience: safeParse(refreshed.experience, []),
    education: safeParse(refreshed.education, []),
    languages: safeParse(refreshed.languages, [])
  });
}));

router.put('/jobseeker/profile', requireAuth, requireRole(ROLES.JOB_SEEKER), profileValidator, validateRequest, asyncHandler(async (req, res) => {
  const skills = JSON.stringify(req.body.skills || []);
  const experience = JSON.stringify(req.body.experience || []);
  const education = JSON.stringify(req.body.education || []);
  const languages = JSON.stringify(req.body.languages || []);

  const completeness = calculateCompletion(req.body);

  dbClient.run(
    `UPDATE job_seeker_profiles
      SET headline = ?, city = ?, skills_json = ?, experience_json = ?, education_json = ?, languages_json = ?, about = ?, profile_completion = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
    [
      req.body.headline || null,
      req.body.city || null,
      skills,
      experience,
      education,
      languages,
      req.body.about || null,
      completeness,
      req.user.id
    ]
  );

  return res.json({ success: true, message: 'Profili u perditesua me sukses.', profileCompletion: completeness });
}));

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

function calculateCompletion(data) {
  let score = 0;
  if (data.headline) score += 20;
  if (data.city) score += 10;
  if (Array.isArray(data.skills) && data.skills.length) score += 25;
  if (Array.isArray(data.experience) && data.experience.length) score += 25;
  if (Array.isArray(data.education) && data.education.length) score += 10;
  if (data.about) score += 10;
  return score;
}

export default router;