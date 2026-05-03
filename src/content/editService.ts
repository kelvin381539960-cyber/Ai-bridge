import { Buffer } from 'node:buffer';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { createFile, readFile, updateFile } from '../github/fileService.js';

export type EditBaseArgs = {
  owner: string;
  repo: string;
  branch?: string;
  path: string;
  outputPath?: string;
  message?: string;
};

export async function createDocxFromText(args: EditBaseArgs & { text: string }) {
  const paragraphs = args.text.split(/\n{2,}/).map((block) => {
    return new Paragraph({ children: [new TextRun(block.replace(/\n/g, ' '))] });
  });

  const doc = new Document({ sections: [{ children: paragraphs }] });
  const buffer = await Packer.toBuffer(doc);
  const targetPath = args.outputPath || args.path;

  return createFile({
    owner: args.owner,
    repo: args.repo,
    branch: args.branch,
    path: targetPath,
    content: buffer.toString('base64'),
    encoding: 'base64',
    message: args.message || `Create DOCX ${targetPath}`,
  });
}

export async function replaceTextFileContent(args: EditBaseArgs & { replacements: Array<{ from: string; to: string }> }) {
  const file = await readFile({ owner: args.owner, repo: args.repo, branch: args.branch, path: args.path });
  if (!file.contentText) {
    throw Object.assign(new Error('File is not readable as text'), { statusCode: 400 });
  }

  let next = file.contentText;
  for (const replacement of args.replacements) {
    next = next.split(replacement.from).join(replacement.to);
  }

  const targetPath = args.outputPath || args.path;
  const writer = targetPath === args.path ? updateFile : createFile;
  return writer({
    owner: args.owner,
    repo: args.repo,
    branch: args.branch,
    path: targetPath,
    content: next,
    encoding: 'utf-8',
    message: args.message || `Replace text in ${targetPath}`,
  });
}

export async function updateExcelCell(args: EditBaseArgs & { sheetName: string; cell: string; value: string | number | boolean | null }) {
  const xlsx = await import('xlsx');
  const file = await readFile({ owner: args.owner, repo: args.repo, branch: args.branch, path: args.path });
  const workbook = xlsx.read(Buffer.from(file.contentBase64, 'base64'), { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[args.sheetName];
  if (!sheet) {
    throw Object.assign(new Error(`Sheet not found: ${args.sheetName}`), { statusCode: 404 });
  }

  sheet[args.cell] = { t: typeof args.value === 'number' ? 'n' : typeof args.value === 'boolean' ? 'b' : 's', v: args.value ?? '' };
  const output = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const targetPath = args.outputPath || args.path;
  const writer = targetPath === args.path ? updateFile : createFile;

  return writer({
    owner: args.owner,
    repo: args.repo,
    branch: args.branch,
    path: targetPath,
    content: output.toString('base64'),
    encoding: 'base64',
    message: args.message || `Update Excel cell ${args.sheetName}!${args.cell}`,
  });
}

export async function appendExcelRows(args: EditBaseArgs & { sheetName: string; rows: Array<Record<string, unknown>> }) {
  const xlsx = await import('xlsx');
  const file = await readFile({ owner: args.owner, repo: args.repo, branch: args.branch, path: args.path });
  const workbook = xlsx.read(Buffer.from(file.contentBase64, 'base64'), { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[args.sheetName];
  if (!sheet) {
    throw Object.assign(new Error(`Sheet not found: ${args.sheetName}`), { statusCode: 404 });
  }

  const existing = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const nextRows = existing.concat(args.rows);
  workbook.Sheets[args.sheetName] = xlsx.utils.json_to_sheet(nextRows);

  const output = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const targetPath = args.outputPath || args.path;
  const writer = targetPath === args.path ? updateFile : createFile;

  return writer({
    owner: args.owner,
    repo: args.repo,
    branch: args.branch,
    path: targetPath,
    content: output.toString('base64'),
    encoding: 'base64',
    message: args.message || `Append rows to ${args.sheetName}`,
  });
}
