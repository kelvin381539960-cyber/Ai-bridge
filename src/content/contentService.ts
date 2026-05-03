import { Buffer } from 'node:buffer';
import path from 'node:path';
import { readFile } from '../github/fileService.js';

export type ExtractArgs = {
  owner: string;
  repo: string;
  branch?: string;
  path: string;
};

export async function extractContent(args: ExtractArgs) {
  const file = await readFile(args);
  const ext = path.extname(args.path).toLowerCase();
  const buffer = Buffer.from(file.contentBase64, 'base64');

  if (['.md', '.txt', '.json', '.yaml', '.yml', '.ts', '.js', '.py', '.html', '.css'].includes(ext)) {
    return {
      type: 'text',
      path: file.path,
      size: file.size,
      text: buffer.toString('utf8'),
    };
  }

  if (ext === '.pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const parsed = await pdfParse(buffer);
    return {
      type: 'pdf',
      path: file.path,
      size: file.size,
      pages: parsed.numpages,
      text: parsed.text,
      info: parsed.info,
      metadata: parsed.metadata,
    };
  }

  if (ext === '.docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return {
      type: 'docx',
      path: file.path,
      size: file.size,
      text: result.value,
      messages: result.messages,
    };
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const xlsx = await import('xlsx');
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
    const sheets = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
      return {
        name: sheetName,
        rowCount: rows.length,
        previewRows: rows.slice(0, 50),
      };
    });
    return {
      type: 'excel',
      path: file.path,
      size: file.size,
      sheets,
    };
  }

  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
    return {
      type: 'image',
      path: file.path,
      size: file.size,
      contentBase64: file.contentBase64,
      note: 'Image binary is returned as base64 for downstream vision or preview tools. Pixel-level editing is not supported in v0.1.',
    };
  }

  return {
    type: 'binary',
    path: file.path,
    size: file.size,
    contentBase64: file.contentBase64,
    note: 'Unsupported content type for extraction. File-level operations are still supported.',
  };
}
