// Koment: Ky helper shmang perseritjen e try/catch ne route handlers async.
export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}