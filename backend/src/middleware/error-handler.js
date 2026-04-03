export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `Rruga nuk u gjet: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId
  });
}

export function errorHandler(err, req, res, _next) {
  let statusCode = Number(err?.statusCode) || 500;
  if (err?.name === 'MulterError') {
    statusCode = err.code === 'LIMIT_FILE_SIZE' ? 400 : 400;
  }

  const safeMessage = statusCode >= 500
    ? 'Gabim i brendshem ne server.'
    : (
      err?.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE'
        ? 'Skedari eshte me i madh se limiti prej 5MB.'
        : (err?.message || 'Gabim i panjohur.')
    );

  console.error(`[${req.requestId}]`, err);

  return res.status(statusCode).json({
    success: false,
    message: safeMessage,
    requestId: req.requestId
  });
}
