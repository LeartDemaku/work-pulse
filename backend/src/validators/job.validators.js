import { body, param, query } from 'express-validator';
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, JOB_STATUSES, WORK_MODES } from '../config/constants.js';

export const listJobsValidator = [
  query('search').optional().trim().isLength({ max: 100 }),
  query('location').optional().trim().isLength({ max: 80 }),
  query('employmentType').optional().isIn(EMPLOYMENT_TYPES),
  query('experienceLevel').optional().isIn(EXPERIENCE_LEVELS),
  query('status').optional().isIn(JOB_STATUSES),
  query('workMode').optional().isIn(WORK_MODES)
];

export const jobIdParamValidator = [
  param('id')
    .trim()
    .toInt()
    .isInt({ min: 1 })
    .withMessage('ID e punës nuk është valide.')
];

export const createOrUpdateJobValidator = [
  body('title').trim().isLength({ min: 2, max: 180 }).withMessage('Titulli duhet të ketë 2-180 karaktere.'),
  body('description').trim().isLength({ min: 20 }).withMessage('Përshkrimi duhet të ketë të paktën 20 karaktere.'),
  body('location').optional({ values: 'falsy' }).trim().isLength({ max: 80 }),
  body('positions').optional().isInt({ min: 1, max: 100 }).withMessage('Numri i pozitave nuk është valid.'),
  body('employmentType').optional().isIn(EMPLOYMENT_TYPES),
  body('experienceLevel').optional().isIn(EXPERIENCE_LEVELS),
  body('workMode').optional().isIn(WORK_MODES),
  body('status').optional().isIn(JOB_STATUSES),
  body('salaryMin').optional({ values: 'falsy' }).isInt({ min: 0 }),
  body('salaryMax').optional({ values: 'falsy' }).isInt({ min: 0 }),
  body('currency').optional({ values: 'falsy' }).trim().isLength({ min: 3, max: 3 }),
  body('deadlineAt').optional({ values: 'falsy' }).isISO8601().withMessage('Data e afatit nuk është valide.'),
  body('requiredSkills')
    .optional({ values: 'falsy' })
    .isArray({ min: 0, max: 50 })
    .withMessage('requiredSkills duhet të jetë listë.')
];

export const updateJobStatusValidator = [
  param('id')
    .trim()
    .toInt()
    .isInt({ min: 1 })
    .withMessage('ID e punës nuk është valide.'),
  body('status').isIn(JOB_STATUSES).withMessage('Statusi i punës nuk është valid.')
];
