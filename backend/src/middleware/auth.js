import { env } from '../config/env.js';
import { verifySessionToken } from '../services/token.service.js';
import { dbClient } from '../db/client.js';

export async function attachCurrentUser(req, _res, next) {
  try {
    const token = req.cookies?.[env.SESSION_COOKIE_NAME];
    if (!token) {
      req.user = null;
      return next();
    }

    const payload = verifySessionToken(token);
    if (!payload?.userId) {
      req.user = null;
      return next();
    }

    const user = dbClient.get(
      'SELECT id, name, email, role, status, is_email_verified AS isEmailVerified FROM users WHERE id = ?',
      [payload.userId]
    );

    if (!user || user.status !== 'active') {
      req.user = null;
      return next();
    }

    req.user = user;
    return next();
  } catch (_error) {
    req.user = null;
    return next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Duhet te kyceni për te vazhduar.'
    });
  }

  return next();
}