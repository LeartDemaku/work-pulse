import { nanoid } from 'nanoid';

// Koment: Cdo kerkese merr nje requestId per gjurmim ne logs.
export function requestIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || nanoid(12);
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}