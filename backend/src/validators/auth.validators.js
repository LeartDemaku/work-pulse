import { body } from 'express-validator';
import { ROLES } from '../config/constants.js';

export const registerValidator = [
  body('role')
    .isIn([ROLES.JOB_SEEKER, ROLES.EMPLOYER])
    .withMessage('Roli duhet te jete job_seeker ose employer.'),
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Emri duhet te këtë 2-120 karaktere.'),
  body('email').trim().isEmail().withMessage('Email-i nuk është valid.'),
  body('phone').trim().isLength({ min: 6, max: 30 }).withMessage('Telefoni duhet te jete valid.'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Fjalëkalimi duhet te këtë se paku 8 karaktere.'),
  body('companyName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage('Emri i kompanise duhet te këtë 2-160 karaktere.'),
  body('companyEmail')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Email-i i kompanise nuk është valid.')
];

export const loginValidator = [
  body('email').trim().isEmail().withMessage('Email-i nuk është valid.'),
  body('password').isLength({ min: 1 }).withMessage('Fjalëkalimi është i detyrueshëm.')
];

export const verifyEmailValidator = [
  body('token').trim().isLength({ min: 12 }).withMessage('Token-i i verifikimit mungon ose është invalid.')
];

export const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Email-i nuk është valid.')
];

export const resetPasswordValidator = [
  body('token').trim().isLength({ min: 20 }).withMessage('Token-i i resetimit mungon ose është invalid.'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('Fjalëkalimi i ri duhet te këtë se paku 8 karaktere.')
];

export const googleAuthValidator = [
  body('idToken')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 20 })
    .withMessage('Google idToken është invalid.'),
  body('accessToken')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 20 })
    .withMessage('Google accessToken është invalid.'),
  body('role')
    .optional({ values: 'falsy' })
    .isIn([ROLES.JOB_SEEKER, ROLES.EMPLOYER])
    .withMessage('Roli duhet te jete job_seeker ose employer.'),
  body('companyName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage('Emri i kompanise duhet te këtë 2-160 karaktere.'),
  body('companyEmail')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Email-i i kompanise nuk është valid.'),
  body().custom((_value, { req }) => {
    const idToken = String(req.body?.idToken || '').trim();
    const accessToken = String(req.body?.accessToken || '').trim();
    if (!idToken && !accessToken) {
      throw new Error('Google credential mungon ose është invalid.');
    }
    return true;
  })
];
