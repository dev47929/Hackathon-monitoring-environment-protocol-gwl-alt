import type { Request, Response, NextFunction } from 'express';

export function rawBodyCapture(req: Request, _res: Response, next: NextFunction): void {
  const chunks: Buffer[] = [];
  let size = 0;
  const MAX = 5 * 1024 * 1024;

  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json') && !contentType.includes('text/plain') && !contentType.includes('application/x-www-form-urlencoded')) {
    return next();
  }

  if (req.readableEnded) {
    return next();
  }

  const cleanup = () => {
    removeListeners();
  };

  const onData = (chunk: Buffer) => {
    size += chunk.length;
    if (size > MAX) {
      removeListeners();
      _res.setHeader('Content-Type', 'application/json');
      _res.status(413).json({ status: 'error', message: 'Payload too large.' });
      req.destroy();
      return;
    }
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  };

  const onEnd = () => {
    removeListeners();
    const rawBody = Buffer.concat(chunks);
    req.rawBody = rawBody;
    if (!req.body) {
      try {
        if (rawBody.length === 0) {
          req.body = undefined;
        } else {
          req.body = JSON.parse(rawBody.toString('utf8'));
        }
      } catch {
        req.body = undefined;
      }
    }
    next();
  };

  const onError = (err: Error) => {
    removeListeners();
    next(err);
  };

  function removeListeners(): void {
    req.removeListener('data', onData);
    req.removeListener('end', onEnd);
    req.removeListener('error', onError);
  }

  req.on('data', onData);
  req.on('end', onEnd);
  req.on('error', onError);
  _res.on('finish', cleanup);
}
