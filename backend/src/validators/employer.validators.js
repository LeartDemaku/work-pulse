import { body } from 'express-validator';

export const updateCompanyValidator = [
  body('name').trim().isLength({ min: 2, max: 160 }).withMessage('Emri i kompanise nuk është valid.'),
  body('legalName').optional({ values: 'falsy' }).trim().isLength({ max: 180 }),
  body('email').trim().isEmail().withMessage('Email-i i kompanise nuk është valid.'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
  body('city').optional({ values: 'falsy' }).trim().isLength({ max: 80 }),
  body('website').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 3000 }),
  body('notificationEmail').optional({ values: 'falsy' }).trim().isEmail()
];

export const inviteMemberValidator = [
  body('email').trim().isEmail().withMessage('Email-i i anetarit nuk është valid.'),
  body('memberRole').optional({ values: 'falsy' }).isIn(['recruiter', 'viewer'])
];