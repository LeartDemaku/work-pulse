import crypto from 'crypto';
import { env } from '../config/env.js';

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value) {
  let normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4) {
    normalized += '=';
  }
  return Buffer.from(normalized, 'base64').toString('utf8');
}

function signRaw(payloadBase64) {
  return crypto
    .createHmac('sha256', env.SESSION_SECRET)
    .update(payloadBase64)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Koment: Token i thjeshte i nenshkruar per session pa shtuar varësi te rende.
export function createSessionToken(payload) {
  const exp = Math.floor(Date.now() / 1000) + env.SESSION_TTL_SECONDS;
  const fullPayload = {
    ...payload,
    exp
  };

  const payloadBase64 = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = signRaw(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [payloadBase64, signature] = token.split('.');
  const expected = signRaw(payloadBase64);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const payloadJson = base64UrlDecode(payloadBase64);
  const payload = JSON.parse(payloadJson);
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp < now) {
    return null;
  }

  return payload;
}