import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message || err);

  const statusCode =
    err.statusCode ||
    (err.message.includes('not found') ? 404 :
     err.message.includes('Unauthorized') ? 401 :
     err.message.includes('Forbidden') ? 403 :
     err.message.includes('Capacity exceeded') ? 409 :
     err.message.includes('Invalid') ? 400 : 500);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
  });
};
