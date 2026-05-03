import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const headerKey = req.header('x-bridge-api-key');
  const bearer = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const key = headerKey || bearer;

  if (!key || key !== config.bridgeApiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
