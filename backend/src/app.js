import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { attachCurrentUser } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import applicationsRoutes from './routes/applications.routes.js';
import employerRoutes from './routes/employer.routes.js';
import adminRoutes from './routes/admin.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import contactRoutes from './routes/contact.routes.js';
import jobSeekerRoutes from './routes/jobseeker.routes.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendPath = path.resolve(__dirname, '../..');

export function createApp() {
  const app = express();

  app.use(helmet({
    crossOriginResourcePolicy: false,
    // Koment: Google popup login kerkon opener policy qe lejon komunikimin me dritaren prind.
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://*.gstatic.com', 'https://*.googleusercontent.com'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", 'https://accounts.google.com', 'https://apis.google.com'],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        connectSrc: ["'self'", 'https://accounts.google.com', 'https://oauth2.googleapis.com', 'https://www.googleapis.com'],
        upgradeInsecureRequests: []
      }
    }
  }));

  app.use(cors({
    origin: env.APP_ORIGIN,
    credentials: true
  }));

  app.use(requestIdMiddleware);
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Koment: Kufizim i pergjithshem vetem për API, jo për skedaret statik te frontend-it.
  const apiLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => (
      req.path === '/health'
      || req.path === '/auth/google/config'
      || req.path === '/auth/me'
    )
  });

  app.use('/api', apiLimiter);

  app.use(attachCurrentUser);

  const authAttemptLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      success: false,
      message: 'Shume kërkesa ne autentikim. Provoni perseri pas pak.'
    }
  });

  const authRateLimitedRoutes = new Set([
    '/register',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/google',
    '/verify-email',
    '/resend-verification'
  ]);

  const selectiveAuthLimiter = (req, res, next) => {
    const isSensitiveAuthMutation = req.method === 'POST' && authRateLimitedRoutes.has(req.path);
    if (!isSensitiveAuthMutation) {
      return next();
    }

    return authAttemptLimiter(req, res, next);
  };

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok', now: new Date().toISOString() });
  });

  app.use('/api/auth', selectiveAuthLimiter, authRoutes);
  app.use('/api', jobsRoutes);
  app.use('/api', applicationsRoutes);
  app.use('/api', employerRoutes);
  app.use('/api', adminRoutes);
  app.use('/api', reportsRoutes);
  app.use('/api', jobSeekerRoutes);
  app.use('/api', contactRoutes);

  // Koment: Endpoints te vjeter ruhen perkohesisht për pajtueshmeri me frontend aktual.
  app.post('/api/register', authAttemptLimiter, (req, res, next) => {
    req.url = '/register';
    authRoutes(req, res, next);
  });

  app.post('/api/login', authAttemptLimiter, (req, res, next) => {
    req.url = '/login';
    authRoutes(req, res, next);
  });

  // Koment: Legacy endpoint - rate limiting handled in applicationsRoutes
  app.post('/api/apply', (req, res, next) => {
    req.url = '/applications';
    applicationsRoutes(req, res, next);
  });

  // Koment: CV-te nuk servohen si skedare statike; qasja behet vetem me endpoint-in e autorizuar.
  app.use('/backend/uploads', (_req, res) => {
    return res.status(404).json({ success: false, message: 'Burimi nuk u gjet.' });
  });

  app.use(express.static(frontendPath));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
