import path from 'node:path';
import JSZip from 'jszip';
import { createFilesInSingleCommit, readFile } from '../github/fileService.js';

export type ExtractDocxImagesArgs = {
  owner: string;
  repo: string;
  branch?: string;
  path: string;
  outputDir?: string;
  mode?: 'preview' | 'save';
  message?: string;
};

function ensureDocx(filePath: string): void {
  if (path.extname(filePath).toLowerCase() !== '.docx') {
    throw Object.assign(new Error('Only .docx files are supported'), { statusCode: 400 });
  }
}

function normalizeOutputDir(outputDir: string | undefined, sourcePath: string): string {
  if (outputDir) return outputDir.replace(/\/+$/, '');
  const parsed = path.posix.parse(sourcePath.replace(/\\/g, '/'));
  const base = parsed.name || 'docx-assets';
  const dir = parsed.dir ? `${parsed.dir}/${base}-assets` : `${base}-assets`;
  return dir.replace(/\/+$/, '');
}

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.bmp') return 'image/bmp';
  if (ext === '.tif' || ext === '.tiff') return 'image/tiff';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

export async function extractDocxImages(args: ExtractDocxImagesArgs) {
  ensureDocx(args.path);
  const mode = args.mode ?? 'preview';
  const source = await readFile({ owner: args.owner, repo: args.repo, branch: args.branch, path: args.path });
  const zip = await JSZip.loadAsync(Buffer.from(source.contentBase64, 'base64'));
  const mediaEntries = Object.values(zip.files)
    .filter((entry) => !entry.dir && entry.name.startsWith('word/media/'))
    .sort((a, b) => a.name.localeCompare(b.name));

  const outputDir = normalizeOutputDir(args.outputDir, args.path);
  const prepared = [];

  for (const entry of mediaEntries) {
    const buffer = await entry.async('nodebuffer');
    const fileName = path.posix.basename(entry.name);
    const outputPath = `${outputDir}/${fileName}`;
    prepared.push({
      fileName,
      sourceEntry: entry.name,
      outputPath,
      size: buffer.byteLength,
      contentType: contentTypeFor(fileName),
      contentBase64: buffer.toString('base64'),
    });
  }

  let commitSha: string | undefined;
  if (mode === 'save' && prepared.length > 0) {
    const created = await createFilesInSingleCommit({
      owner: args.owner,
      repo: args.repo,
      branch: args.branch,
      message: args.message || `Extract ${prepared.length} DOCX images from ${args.path}`,
      files: prepared.map((image) => ({
        path: image.outputPath,
        content: image.contentBase64,
        encoding: 'base64',
      })),
    });
    commitSha = created.commitSha;
  }

  return {
    type: 'docx-images',
    path: source.path,
    mode,
    outputDir,
    count: prepared.length,
    commitSha,
    images: prepared.map((image) => ({
      fileName: image.fileName,
      sourceEntry: image.sourceEntry,
      outputPath: image.outputPath,
      size: image.size,
      contentType: image.contentType,
      contentBase64: mode === 'preview' ? image.contentBase64 : undefined,
      commitSha: mode === 'save' ? commitSha : undefined,
    })),
  };
}
