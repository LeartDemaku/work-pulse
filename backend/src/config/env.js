import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../..');
const envPath = path.join(backendRoot, '.env');

function parseEnvFile(filePath) {
  const parsed = {};
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim();
    parsed[key] = value;
  }

  return parsed;
}

const fileEnv = existsSync(envPath) ? parseEnvFile(envPath) : {};

function readEnv(key, fallback = '') {
  return process.env[key] ?? fileEnv[key] ?? fallback;
}

// Koment: Vlerat qendrore te konfigurimit ruhen ne nje objekt unik.
export const env = {
  NODE_ENV: readEnv('NODE_ENV', 'development'),
  PORT: Number(readEnv('PORT', '3000')),
  APP_ORIGIN: readEnv('APP_ORIGIN', 'http://localhost:3000'),
  SESSION_SECRET: readEnv('SESSION_SECRET', 'ndrysho-kete-secret-ne-produksion'),
  SESSION_COOKIE_NAME: readEnv('SESSION_COOKIE_NAME', 'platforma_session'),
  SESSION_TTL_SECONDS: Number(readEnv('SESSION_TTL_SECONDS', String(60 * 60 * 24 * 7))),
  EMAIL_USER: readEnv('EMAIL_USER', ''),
  EMAIL_PASS: readEnv('EMAIL_PASS', ''),
  GOOGLE_CLIENT_ID: readEnv('GOOGLE_CLIENT_ID', ''),
  ADMIN_EMAIL: readEnv('ADMIN_EMAIL', ''),
  DEFAULT_FROM_EMAIL: readEnv('DEFAULT_FROM_EMAIL', readEnv('EMAIL_USER', '')),
  DB_FILE: readEnv('DB_FILE', path.join(backendRoot, 'punaime.db')),
  RATE_LIMIT_WINDOW_MS: Number(readEnv('RATE_LIMIT_WINDOW_MS', String(15 * 60 * 1000))),
  RATE_LIMIT_MAX_REQUESTS: Number(readEnv('RATE_LIMIT_MAX_REQUESTS', '10000')),
  AUTH_RATE_LIMIT_MAX_REQUESTS: Number(readEnv('AUTH_RATE_LIMIT_MAX_REQUESTS', '1000')),
  APPLY_RATE_LIMIT_MAX_REQUESTS: Number(readEnv('APPLY_RATE_LIMIT_MAX_REQUESTS', '30'))
};

export function isProduction() {
  return env.NODE_ENV === 'production';
}

export function getBackendRoot() {
  return backendRoot;
}

export function getEnvFilePath() {
  return envPath;
}
