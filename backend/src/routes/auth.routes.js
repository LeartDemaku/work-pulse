import { Router } from 'express';
import {
  forgotPasswordValidator,
  googleAuthValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  verifyEmailValidator
} from '../validators/auth.validators.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  clearSessionCookie,
  getGoogleAuthConfig,
  loginOrRegisterGoogleUser,
  loginUser,
  requestPasswordReset,
  registerUser,
  resetPasswordWithToken,
  resendVerification,
  setSessionCookie,
  verifyEmailToken
} from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

router.post('/register', registerValidator, validateRequest, asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  setSessionCookie(res, user);

  return res.json({
    success: true,
    message: 'Regjistrimi u krye me sukses.',
    user
  });
}));

router.post('/login', loginValidator, validateRequest, asyncHandler(async (req, res) => {
  const user = await loginUser(req.body);
  setSessionCookie(res, user);

  return res.json({
    success: true,
    message: 'Hyrja u realizua me sukses.',
    user
  });
}));

router.post('/forgot-password', forgotPasswordValidator, validateRequest, asyncHandler(async (req, res) => {
  await requestPasswordReset(req.body.email, {
    requestedIp: req.ip,
    requestedUserAgent: req.get('user-agent') || null
  });

  return res.json({
    success: true,
    message: 'Nëse email-i ekziston, do të dërgohet një link për resetimin e fjalëkalimit.'
  });
}));

router.post('/reset-password', resetPasswordValidator, validateRequest, asyncHandler(async (req, res) => {
  await resetPasswordWithToken(req.body.token, req.body.newPassword);
  return res.json({ success: true, message: 'Fjalëkalimi u ndryshua me sukses.' });
}));

router.get('/reset-password', asyncHandler(async (req, res) => {
  const token = String(req.query.token || '').trim();
  const target = token
    ? `${env.APP_ORIGIN}/reset-password.html?token=${encodeURIComponent(token)}`
    : `${env.APP_ORIGIN}/reset-password.html?state=missing`;
  return res.redirect(target);
}));

router.get('/google/config', asyncHandler(async (_req, res) => {
  const config = getGoogleAuthConfig();
  return res.json(config);
}));

router.post('/google', googleAuthValidator, validateRequest, asyncHandler(async (req, res) => {
  const user = await loginOrRegisterGoogleUser(req.body);
  setSessionCookie(res, user);

  return res.json({
    success: true,
    message: 'Autentikimi me Google u realizua me sukses.',
    user
  });
}));

router.post('/logout', asyncHandler(async (_req, res) => {
  clearSessionCookie(res);
  return res.json({ success: true, message: 'Dilja u krye me sukses.' });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  return res.json({ success: true, user: req.user });
}));

router.post('/verify-email', verifyEmailValidator, validateRequest, asyncHandler(async (req, res) => {
  await verifyEmailToken(req.body.token);
  return res.json({ success: true, message: 'Email-i u verifikua me sukses.' });
}));

router.get('/verify-email', async (req, res) => {
  const token = String(req.query.token || '').trim();
  const successTarget = req.user?.role === 'employer'
    ? `${env.APP_ORIGIN}/employer-company-settings.html?verify=success`
    : `${env.APP_ORIGIN}/signin.html?verify=success`;
  const errorTarget = req.user?.role === 'employer'
    ? `${env.APP_ORIGIN}/employer-company-settings.html?verify=invalid`
    : `${env.APP_ORIGIN}/signin.html?verify=invalid`;
  const missingTarget = req.user?.role === 'employer'
    ? `${env.APP_ORIGIN}/employer-company-settings.html?verify=missing`
    : `${env.APP_ORIGIN}/signin.html?verify=missing`;

  if (!token) {
    return res.redirect(missingTarget);
  }

  try {
    await verifyEmailToken(token);
    return res.redirect(successTarget);
  } catch (_error) {
    return res.redirect(errorTarget);
  }
});

router.post('/resend-verification', requireAuth, asyncHandler(async (req, res) => {
  const result = await resendVerification(req.user.id);

  if (result.alreadyVerified) {
    return res.json({ success: true, message: 'Email-i është verifikuar tashmë.' });
  }

  return res.json({ success: true, message: 'Token i ri i verifikimit u dergua.' });
}));


export default router;
