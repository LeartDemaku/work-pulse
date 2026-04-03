import { Router } from 'express';
import { body } from 'express-validator';
import { dbClient } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

const reportValidator = [
  body('targetType').isIn(['job', 'application']).withMessage('targetType duhet te jete job ose application.'),
  body('targetId').isInt({ min: 1 }).withMessage('targetId duhet te jete numer valid.'),
  body('reason').trim().isLength({ min: 5, max: 600 }).withMessage('Arsyeja duhet te kete 5-600 karaktere.')
];

router.post('/reports', requireAuth, reportValidator, validateRequest, asyncHandler(async (req, res) => {
  const { targetType, targetId, reason } = req.body;

  dbClient.run(
    'INSERT INTO report_flags (reporter_user_id, target_type, target_id, reason, status) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, targetType, targetId, reason, 'open']
  );

  return res.json({ success: true, message: 'Raporti u dergua me sukses.' });
}));

export default router;