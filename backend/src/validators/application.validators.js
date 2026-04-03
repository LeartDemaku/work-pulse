import { body, param, query } from 'express-validator';
import { APPLICATION_STATUSES } from '../config/constants.js';

export const applyValidator = [
  body('jobId').isInt({ min: 1 }).withMessage('jobId është i detyrueshëm.'),
  body('fullName').trim().isLength({ min: 2, max: 120 }).withMessage('Emri i plote nuk është valid.'),
  body('email').trim().isEmail().withMessage('Email-i nuk është valid.'),
  body('phone').trim().isLength({ min: 6, max: 30 }).withMessage('Telefoni nuk është valid.'),
  body('city').trim().isLength({ min: 2, max: 80 }).withMessage('Qyteti nuk është valid.'),
  body('coverLetter').optional({ values: 'falsy' }).trim().isLength({ max: 3000 })
];

export const updateApplicationStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID e aplikimit nuk është valide.'),
  body('status').isIn(APPLICATION_STATUSES).withMessage('Statusi i aplikimit nuk është valid.'),
  body('note').optional({ values: 'falsy' }).trim().isLength({ max: 500 })
];

export const withdrawApplicationValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID e aplikimit nuk është valide.')
];

export const listJobSeekerApplicationsValidator = [
  query('status').optional().isIn(APPLICATION_STATUSES),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601()
];