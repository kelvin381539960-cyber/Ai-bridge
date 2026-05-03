import { Router } from 'express';
import { z } from 'zod';
import { createFile, deleteFile, fileHistory, listTree, moveFile, readFile, updateFile } from '../github/fileService.js';

export const filesRouter = Router();

const repoSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().optional(),
});

const pathQuerySchema = repoSchema.extend({
  path: z.string().optional(),
  recursive: z.coerce.boolean().optional(),
});

const fileQuerySchema = repoSchema.extend({ path: z.string().min(1) });

filesRouter.get('/tree', async (req, res, next) => {
  try {
    const input = pathQuerySchema.parse(req.query);
    res.json({ data: await listTree(input) });
  } catch (error) {
    next(error);
  }
});

filesRouter.get('/file', async (req, res, next) => {
  try {
    const input = fileQuerySchema.parse(req.query);
    res.json({ data: await readFile(input) });
  } catch (error) {
    next(error);
  }
});

filesRouter.post('/file/create', async (req, res, next) => {
  try {
    const input = repoSchema.extend({
      path: z.string().min(1),
      content: z.string(),
      encoding: z.enum(['utf-8', 'base64']).optional(),
      message: z.string().optional(),
    }).parse(req.body);
    res.json({ data: await createFile(input) });
  } catch (error) {
    next(error);
  }
});

filesRouter.post('/file/update', async (req, res, next) => {
  try {
    const input = repoSchema.extend({
      path: z.string().min(1),
      content: z.string(),
      sha: z.string().optional(),
      encoding: z.enum(['utf-8', 'base64']).optional(),
      message: z.string().optional(),
    }).parse(req.body);
    res.json({ data: await updateFile(input) });
  } catch (error) {
    next(error);
  }
});

filesRouter.post('/file/delete', async (req, res, next) => {
  try {
    const input = repoSchema.extend({
      path: z.string().min(1),
      sha: z.string().optional(),
      message: z.string().optional(),
    }).parse(req.body);
    res.json({ data: await deleteFile(input) });
  } catch (error) {
    next(error);
  }
});

filesRouter.post('/file/move', async (req, res, next) => {
  try {
    const input = repoSchema.extend({
      fromPath: z.string().min(1),
      toPath: z.string().min(1),
      message: z.string().optional(),
    }).parse(req.body);
    res.json({ data: await moveFile(input) });
  } catch (error) {
    next(error);
  }
});

filesRouter.get('/file/history', async (req, res, next) => {
  try {
    const input = fileQuerySchema.extend({ perPage: z.coerce.number().int().min(1).max(100).optional() }).parse(req.query);
    res.json({ data: await fileHistory(input) });
  } catch (error) {
    next(error);
  }
});
