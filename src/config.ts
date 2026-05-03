import 'dotenv/config';

function splitCsv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const config = {
  port: numberEnv('PORT', 3000),
  bridgeApiKey: process.env.BRIDGE_API_KEY ?? '',
  githubToken: process.env.GITHUB_TOKEN ?? '',
  defaultOwner: process.env.DEFAULT_OWNER ?? '',
  defaultBranch: process.env.DEFAULT_BRANCH ?? 'main',
  allowedRepos: splitCsv(process.env.ALLOWED_REPOS),
  allowedPathPrefixes: splitCsv(process.env.ALLOWED_PATH_PREFIXES),
  maxBatchOperations: numberEnv('MAX_BATCH_OPERATIONS', 20),
  maxTextBytes: numberEnv('MAX_TEXT_BYTES', 1_000_000),
  maxBinaryBytes: numberEnv('MAX_BINARY_BYTES', 5_000_000),
};

export function assertConfig(): void {
  const missing: string[] = [];
  if (!config.bridgeApiKey) missing.push('BRIDGE_API_KEY');
  if (!config.githubToken) missing.push('GITHUB_TOKEN');
  if (config.allowedRepos.length === 0) missing.push('ALLOWED_REPOS');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
