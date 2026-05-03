import { Router } from 'express';
import { z } from 'zod';
import { extractContent } from '../content/contentService.js';
import { extractDocxImages } from '../content/docxAssetService.js';

export const contentRouter = Router();

const extractSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().optional(),
  path: z.string().min(1),
  sheetName: z.string().optional(),
  maxRows: z.coerce.number().int().min(1).max(500).optional(),
});

const docxImagesSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().optional(),
  path: z.string().min(1),
  outputDir: z.string().optional(),
  mode: z.enum(['preview', 'save']).optional(),
  message: z.string().optional(),
});

contentRouter.get('/extract', async (req, res, next) => {
  try {
    const input = extractSchema.parse(req.query);
    res.json({ data: await extractContent(input) });
  } catch (error) {
    next(error);
  }
});

contentRouter.post('/docx/extract-images', async (req, res, next) => {
  try {
    const input = docxImagesSchema.parse(req.body);
    res.json({ data: await extractDocxImages(input) });
  } catch (error) {
    next(error);
  }
});
