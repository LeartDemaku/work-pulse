import { validationResult } from 'express-validator';
import { existsSync, unlinkSync } from 'fs';

export function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  if (req.file?.path && existsSync(req.file.path)) {
    try {
      unlinkSync(req.file.path);
    } catch (_error) {
      // Koment: Gabimi ne pastrimin e file-it te ngarkuar nuk duhet te nderprese pergjigjen 400.
    }
  }

  const formatted = result.array().map((item) => ({
    field: item.path,
    message: item.msg
  }));

  return res.status(400).json({
    success: false,
    message: 'Te dhenat e derguara nuk jane valide.',
    errors: formatted
  });
}
