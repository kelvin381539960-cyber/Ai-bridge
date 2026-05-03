import { Router } from 'express';
import { z } from 'zod';
import { appendExcelRows, createDocxFromText, replaceTextFileContent, updateExcelCell } from '../content/editService.js';

export const editRouter = Router();

const baseSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().optional(),
  path: z.string().min(1),
  outputPath: z.string().optional(),
  message: z.string().optional(),
});

editRouter.post('/text/replace', async (req, res, next) => {
  try {
    const input = baseSchema.extend({
      replacements: z.array(z.object({ from: z.string(), to: z.string() })).min(1),
    }).parse(req.body);
    res.json({ data: await replaceTextFileContent(input) });
  } catch (error) {
    next(error);
  }
});

editRouter.post('/docx/from-text', async (req, res, next) => {
  try {
    const input = baseSchema.extend({ text: z.string() }).parse(req.body);
    res.json({ data: await createDocxFromText(input) });
  } catch (error) {
    next(error);
  }
});

editRouter.post('/excel/update-cell', async (req, res, next) => {
  try {
    const input = baseSchema.extend({
      sheetName: z.string().min(1),
      cell: z.string().min(1),
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    }).parse(req.body);
    res.json({ data: await updateExcelCell(input) });
  } catch (error) {
    next(error);
  }
});

editRouter.post('/excel/append-rows', async (req, res, next) => {
  try {
    const input = baseSchema.extend({
      sheetName: z.string().min(1),
      rows: z.array(z.record(z.unknown())).min(1),
    }).parse(req.body);
    res.json({ data: await appendExcelRows(input) });
  } catch (error) {
    next(error);
  }
});
