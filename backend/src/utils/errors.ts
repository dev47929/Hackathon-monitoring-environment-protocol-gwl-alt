import type { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function badRequest(message: string, details?: unknown): HttpError {
  return new HttpError(400, message, details);
}

export function unauthorized(message: string = 'Unauthorized'): HttpError {
  return new HttpError(401, message);
}

export function forbidden(message: string = 'Forbidden'): HttpError {
  return new HttpError(403, message);
}

export function notFound(message: string = 'Not Found'): HttpError {
  return new HttpError(404, message);
}

export function conflict(message: string, details?: unknown): HttpError {
  return new HttpError(409, message, details);
}

export function internal(message: string = 'Internal Server Error'): HttpError {
  return new HttpError(500, message);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ status: 'error', message: 'Malformed JSON body.' });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error('[error]', err instanceof Error ? err.stack || message : err);
  res.status(500).json({ status: 'error', message });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ status: 'error', message: 'Route not found.' });
}

export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown> | unknown,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}
