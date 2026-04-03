import { body, param } from 'express-validator';

export const moderationStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID nuk eshte valide.'),
  body('status').isIn(['active', 'paused', 'removed']).withMessage('Status i pavlefshem.')
];

export const userStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID nuk eshte valide.'),
  body('status').isIn(['active', 'suspended', 'deleted']).withMessage('Status i pavlefshem.')
];

export const resolveReportValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID nuk eshte valide.'),
  body('resolution').optional({ values: 'falsy' }).trim().isLength({ max: 500 })
];