import { config } from '../config.js';

export function normalizeRepo(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

export function assertRepoAllowed(owner: string, repo: string): void {
  const fullName = normalizeRepo(owner, repo);
  if (!config.allowedRepos.includes(fullName)) {
    throw Object.assign(new Error(`Repository is not allowed: ${fullName}`), { statusCode: 403 });
  }
}

export function normalizePath(path: string): string {
  const cleaned = path.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = cleaned.split('/').filter(Boolean);

  if (parts.some((part) => part === '..' || part === '.')) {
    throw Object.assign(new Error('Invalid path traversal segment'), { statusCode: 400 });
  }

  return parts.join('/');
}

export function assertPathAllowed(path: string): string {
  const normalized = normalizePath(path);
  if (!normalized) {
    throw Object.assign(new Error('Path is required'), { statusCode: 400 });
  }

  if (config.allowedPathPrefixes.length === 0) return normalized;

  const allowed = config.allowedPathPrefixes.some((prefix) => {
    const normalizedPrefix = normalizePath(prefix);
    return normalized === normalizedPrefix || normalized.startsWith(`${normalizedPrefix}/`);
  });

  if (!allowed) {
    throw Object.assign(new Error(`Path is not allowed: ${normalized}`), { statusCode: 403 });
  }

  return normalized;
}
