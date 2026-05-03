import { Router } from 'express';
import { z } from 'zod';
import { extractContent } from '../content/contentService.js';

export const contentRouter = Router();

const extractSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().optional(),
  path: z.string().min(1),
});

contentRouter.get('/extract', async (req, res, next) => {
  try {
    const input = extractSchema.parse(req.query);
    res.json({ data: await extractContent(input) });
  } catch (error) {
    next(error);
  }
});
