import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { OAuth2Client } from 'google-auth-library';
import { env, isProduction } from '../config/env.js';
import { ROLES } from '../config/constants.js';
import { dbClient } from '../db/client.js';
import { createSessionToken } from './token.service.js';
import { sendEmail } from './email.service.js';
import { trackEvent } from './analytics.service.js';

let googleClient = null;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function getGoogleClient() {
  if (!env.GOOGLE_CLIENT_ID) {
    const error = new Error('Google autentikimi nuk është i konfiguruar ne server.');
    error.statusCode = 503;
    throw error;
  }

  if (!googleClient) {
    googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  return googleClient;
}

export function setSessionCookie(res, user) {
  const token = createSessionToken({ userId: user.id, role: user.role });

  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    maxAge: env.SESSION_TTL_SECONDS * 1000,
    path: '/'
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
}

function userToSafe(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: Number(user.is_email_verified || user.isEmailVerified || 0) === 1
  };
}

// Koment: Regjistrimi trajton qarte dy role dhe krijon records ndihmese sipas rolit.
export async function registerUser(payload) {
  const role = payload.role;
  const name = String(payload.name || '').trim();
  const phone = String(payload.phone || '').trim();
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || '');

  const existing = dbClient.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    const error = new Error('Ky email ekziston tashmë.');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const isEmailVerified = role === ROLES.JOB_SEEKER ? 1 : 0;

  const result = dbClient.run(
    'INSERT INTO users (name, phone, email, password, role, password_hash, is_email_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, phone, email, '__legacy_placeholder__', role, passwordHash, isEmailVerified, 'active']
  );

  const userId = result.lastInsertId;

  if (role === ROLES.JOB_SEEKER) {
    dbClient.run(
      'INSERT INTO job_seeker_profiles (user_id, city) VALUES (?, ?)',
      [userId, payload.city || null]
    );
  }

  if (role === ROLES.EMPLOYER) {
    const companyName = String(payload.companyName || '').trim();
    const companyEmail = normalizeEmail(payload.companyEmail || email);

    const companyResult = dbClient.run(
      'INSERT INTO companies (owner_user_id, name, legal_name, email, phone, city, website, description, business_number, notification_email, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        companyName || `${name} Company`,
        payload.legalName || null,
        companyEmail,
        payload.companyPhone || phone || null,
        payload.companyCity || null,
        payload.website || null,
        payload.companyDescription || null,
        payload.businessNumber || null,
        companyEmail,
        0
      ]
    );

    dbClient.run(
      'INSERT INTO employer_members (company_id, user_id, member_role, accepted_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [companyResult.lastInsertId, userId, 'recruiter']
    );

    const verifyToken = nanoid(36);
    dbClient.run(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, DATETIME(CURRENT_TIMESTAMP, \'+2 day\'))',
      [userId, verifyToken]
    );

    await sendEmail({
      recipient: email,
      templateKey: 'employer_verify_email',
      relatedEntity: `users:${userId}`,
      payload: {
        fullName: name,
        verificationToken: verifyToken
      }
    });
  }

  const user = dbClient.get(
    'SELECT id, name, email, role, is_email_verified FROM users WHERE id = ?',
    [userId]
  );

  trackEvent({
    userId,
    role,
    eventKey: 'signup_completed',
    eventValue: role
  });

  return userToSafe(user);
}

export async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = dbClient.get(
    'SELECT id, name, email, role, status, password_hash, is_email_verified FROM users WHERE email = ?',
    [normalizedEmail]
  );

  if (!user) {
    const error = new Error('Email ose fjalekalim i pasakte.');
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== 'active') {
    const error = new Error('Llogaria nuk është aktive.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(String(password || ''), user.password_hash || '');
  if (!isMatch) {
    const error = new Error('Email ose fjalekalim i pasakte.');
    error.statusCode = 401;
    throw error;
  }

  dbClient.run('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

  trackEvent({
    userId: user.id,
    role: user.role,
    eventKey: 'login_success'
  });

  return userToSafe(user);
}

export async function requestPasswordReset(email, context = {}) {
  const normalizedEmail = normalizeEmail(email);
  const user = dbClient.get(
    'SELECT id, name, email, role, status FROM users WHERE email = ?',
    [normalizedEmail]
  );

  // Koment: Për sigurine, endpoint-i nuk zbulon nëse email-i ekziston apo jo.
  if (!user || user.status !== 'active') {
    return { accepted: true };
  }

  const resetToken = nanoid(48);

  dbClient.transaction((trx) => {
    trx.run(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL',
      [user.id]
    );
    trx.run(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at, requested_ip, requested_user_agent) VALUES (?, ?, DATETIME(CURRENT_TIMESTAMP, '+2 hour'), ?, ?)",
      [user.id, resetToken, context.requestedIp || null, context.requestedUserAgent || null]
    );
  });

  await sendEmail({
    recipient: user.email,
    templateKey: 'password_reset',
    relatedEntity: `users:${user.id}`,
    payload: {
      fullName: user.name,
      resetToken
    }
  });

  trackEvent({
    userId: user.id,
    role: user.role,
    eventKey: 'password_reset_requested'
  });

  return { accepted: true };
}

export async function resetPasswordWithToken(token, newPassword) {
  const row = dbClient.get(
    `SELECT
      prt.id,
      prt.user_id AS userId,
      prt.expires_at AS expiresAt,
      u.role,
      u.status
     FROM password_reset_tokens prt
     INNER JOIN users u ON u.id = prt.user_id
     WHERE prt.token = ? AND prt.used_at IS NULL`,
    [String(token || '').trim()]
  );

  if (!row) {
    const error = new Error('Token-i i resetimit është i pavlefshëm ose i skaduar.');
    error.statusCode = 400;
    throw error;
  }

  const isExpired = new Date(row.expiresAt).getTime() < Date.now();
  if (isExpired) {
    const error = new Error('Token-i i resetimit është i pavlefshëm ose i skaduar.');
    error.statusCode = 400;
    throw error;
  }

  if (row.status !== 'active') {
    const error = new Error('Llogaria nuk është aktive.');
    error.statusCode = 403;
    throw error;
  }

  const passwordHash = await bcrypt.hash(String(newPassword || ''), 10);

  dbClient.transaction((trx) => {
    let updateSql = 'UPDATE users SET password_hash = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?';
    let updateParams = [passwordHash, row.userId];

    if (trx.hasColumn('users', 'password')) {
      updateSql = 'UPDATE users SET password_hash = ?, password = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?';
      updateParams = [passwordHash, '__password_reset__', row.userId];
    }

    trx.run(updateSql, updateParams);

    trx.run('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
    trx.run(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL',
      [row.userId]
    );
  });

  trackEvent({
    userId: row.userId,
    role: row.role,
    eventKey: 'password_reset_completed'
  });

  return { success: true };
}

export function getGoogleAuthConfig() {
  return {
    enabled: Boolean(env.GOOGLE_CLIENT_ID),
    clientId: env.GOOGLE_CLIENT_ID || ''
  };
}

export async function loginOrRegisterGoogleUser(payload = {}) {
  const idToken = String(payload.idToken || '').trim();
  const accessToken = String(payload.accessToken || '').trim();
  const requestedRole = payload.role === ROLES.EMPLOYER ? ROLES.EMPLOYER : ROLES.JOB_SEEKER;

  if (requestedRole === ROLES.ADMIN) {
    const error = new Error('Regjistrimi me Google nuk lejohet për admin.');
    error.statusCode = 400;
    throw error;
  }

  if (requestedRole === ROLES.EMPLOYER && !String(payload.companyName || '').trim()) {
    const error = new Error('Emri i kompanise është i detyrueshëm për regjistrim employer me Google.');
    error.statusCode = 400;
    throw error;
  }

  if (!idToken && !accessToken) {
    const error = new Error('Google credential është invalid ose ka skaduar.');
    error.statusCode = 401;
    throw error;
  }

  let googlePayload = null;
  if (idToken) {
    const client = getGoogleClient();
    let ticket = null;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID
      });
      googlePayload = ticket.getPayload();
    } catch (_error) {
      // Koment: Kur idToken deshton, provojme fallback me accessToken nëse ekziston.
      if (!accessToken) {
        const error = new Error('Google credential është invalid ose ka skaduar.');
        error.statusCode = 401;
        throw error;
      }
    }
  }

  if (!googlePayload && accessToken) {
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!userInfoResponse.ok) {
      const error = new Error('Google credential është invalid ose ka skaduar.');
      error.statusCode = 401;
      throw error;
    }

    googlePayload = await userInfoResponse.json();
  }

  const email = normalizeEmail(googlePayload?.email || '');

  if (!email) {
    const error = new Error('Google nuk ktheu email valid.');
    error.statusCode = 400;
    throw error;
  }

  if (!googlePayload?.email_verified) {
    const error = new Error('Llogaria Google duhet te këtë email te verifikuar.');
    error.statusCode = 400;
    throw error;
  }

  const fallbackName = String(payload.name || '').trim()
    || String(googlePayload?.name || '').trim()
    || String(googlePayload?.given_name || '').trim()
    || 'Perdorues';
  const fallbackPhone = String(payload.phone || '').trim() || null;

  let user = dbClient.get(
    'SELECT id, name, email, role, status, is_email_verified FROM users WHERE email = ?',
    [email]
  );

  if (!user) {
    const randomPassword = nanoid(32);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const insertResult = dbClient.run(
      'INSERT INTO users (name, phone, email, password, role, password_hash, is_email_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [fallbackName, fallbackPhone, email, '__oauth_google__', requestedRole, passwordHash, 1, 'active']
    );

    const userId = insertResult.lastInsertId;

    if (requestedRole === ROLES.JOB_SEEKER) {
      dbClient.run(
        'INSERT INTO job_seeker_profiles (user_id, city) VALUES (?, ?)',
        [userId, payload.city || null]
      );
    } else if (requestedRole === ROLES.EMPLOYER) {
      const companyName = String(payload.companyName || '').trim();
      const companyEmail = normalizeEmail(payload.companyEmail || email);

      const companyResult = dbClient.run(
        'INSERT INTO companies (owner_user_id, name, legal_name, email, phone, city, website, description, business_number, notification_email, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          userId,
          companyName,
          payload.legalName || null,
          companyEmail,
          payload.companyPhone || fallbackPhone || null,
          payload.companyCity || null,
          payload.website || null,
          payload.companyDescription || null,
          payload.businessNumber || null,
          companyEmail,
          1
        ]
      );

      dbClient.run(
        'INSERT INTO employer_members (company_id, user_id, member_role, accepted_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [companyResult.lastInsertId, userId, 'recruiter']
      );
    }

    user = dbClient.get(
      'SELECT id, name, email, role, status, is_email_verified FROM users WHERE id = ?',
      [userId]
    );

    trackEvent({
      userId,
      role: requestedRole,
      eventKey: 'signup_completed',
      eventValue: requestedRole,
      metadata: { source: 'google_oauth' }
    });
  } else {
    if (user.status !== 'active') {
      const error = new Error('Llogaria nuk është aktive.');
      error.statusCode = 403;
      throw error;
    }

    dbClient.run(
      'UPDATE users SET is_email_verified = 1, last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    user = dbClient.get(
      'SELECT id, name, email, role, status, is_email_verified FROM users WHERE id = ?',
      [user.id]
    );
  }

  trackEvent({
    userId: user.id,
    role: user.role,
    eventKey: 'login_success',
    metadata: { source: 'google_oauth' }
  });

  return userToSafe(user);
}

export async function verifyEmailToken(token) {
  const row = dbClient.get(
    'SELECT id, user_id AS userId, expires_at AS expiresAt FROM email_verification_tokens WHERE token = ? AND used_at IS NULL',
    [token]
  );

  if (!row) {
    const error = new Error('Token i verifikimit është i pavlefshëm.');
    error.statusCode = 400;
    throw error;
  }

  const isExpired = new Date(row.expiresAt).getTime() < Date.now();
  if (isExpired) {
    const error = new Error('Token i verifikimit ka skaduar.');
    error.statusCode = 400;
    throw error;
  }

  dbClient.transaction((trx) => {
    trx.run('UPDATE users SET is_email_verified = 1 WHERE id = ?', [row.userId]);
    trx.run('UPDATE companies SET is_verified = 1 WHERE owner_user_id = ?', [row.userId]);
    trx.run('UPDATE email_verification_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
  });

  trackEvent({
    userId: row.userId,
    eventKey: 'email_verified'
  });

  return { success: true };
}

export async function resendVerification(userId) {
  const user = dbClient.get('SELECT id, name, email, role, is_email_verified FROM users WHERE id = ?', [userId]);
  if (!user || user.role !== ROLES.EMPLOYER) {
    const error = new Error('Vetem employer mund te verifikoje email-in.');
    error.statusCode = 400;
    throw error;
  }

  if (Number(user.is_email_verified) === 1) {
    return { alreadyVerified: true };
  }

  const verifyToken = nanoid(36);
  dbClient.run(
    'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, DATETIME(CURRENT_TIMESTAMP, \'+2 day\'))',
    [user.id, verifyToken]
  );

  await sendEmail({
    recipient: user.email,
    templateKey: 'employer_verify_email',
    relatedEntity: `users:${user.id}`,
    payload: {
      fullName: user.name,
      verificationToken: verifyToken
    }
  });

  trackEvent({
    userId: user.id,
    role: user.role,
    eventKey: 'verification_resent'
  });

  return { sent: true };
}


