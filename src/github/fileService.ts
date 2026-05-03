import { Buffer } from 'node:buffer';
import { octokit } from './githubClient.js';
import { assertPathAllowed, assertRepoAllowed } from '../utils/pathGuard.js';
import { config } from '../config.js';

type BaseArgs = {
  owner: string;
  repo: string;
  branch?: string;
};

type FileArgs = BaseArgs & {
  path: string;
};

export type GitFile = {
  path: string;
  sha: string;
  encoding: string;
  size: number;
  contentBase64: string;
  contentText?: string;
  downloadUrl?: string | null;
};

function branchOrDefault(branch?: string): string {
  return branch || config.defaultBranch;
}

function guard(owner: string, repo: string, path?: string): string | undefined {
  assertRepoAllowed(owner, repo);
  if (path === undefined) return undefined;
  return assertPathAllowed(path);
}

function encodeContent(content: string, encoding: 'utf-8' | 'base64'): string {
  return encoding === 'base64' ? content : Buffer.from(content, 'utf8').toString('base64');
}

function decodeContent(contentBase64: string): string {
  return Buffer.from(contentBase64, 'base64').toString('utf8');
}

export async function listTree(args: BaseArgs & { path?: string; recursive?: boolean }) {
  guard(args.owner, args.repo, args.path || undefined);
  const ref = branchOrDefault(args.branch);
  const branch = await octokit.repos.getBranch({ owner: args.owner, repo: args.repo, branch: ref });
  const tree = await octokit.git.getTree({
    owner: args.owner,
    repo: args.repo,
    tree_sha: branch.data.commit.sha,
    recursive: args.recursive ? 'true' : undefined,
  });

  const basePath = args.path ? assertPathAllowed(args.path) : '';
  return tree.data.tree
    .filter((item) => item.path)
    .filter((item) => !basePath || item.path === basePath || item.path?.startsWith(`${basePath}/`))
    .map((item) => ({ path: item.path, type: item.type, sha: item.sha, size: item.size }));
}

export async function readFile(args: FileArgs): Promise<GitFile> {
  const path = guard(args.owner, args.repo, args.path)!;
  const response = await octokit.repos.getContent({
    owner: args.owner,
    repo: args.repo,
    path,
    ref: branchOrDefault(args.branch),
  });

  if (Array.isArray(response.data) || response.data.type !== 'file') {
    throw Object.assign(new Error('Path is not a file'), { statusCode: 400 });
  }

  const contentBase64 = response.data.content.replace(/\n/g, '');
  const result: GitFile = {
    path: response.data.path,
    sha: response.data.sha,
    encoding: response.data.encoding,
    size: response.data.size,
    contentBase64,
    downloadUrl: response.data.download_url,
  };

  if (response.data.size <= config.maxTextBytes) {
    try {
      result.contentText = decodeContent(contentBase64);
    } catch {
      // Binary files may fail to decode cleanly as UTF-8. Base64 is still returned.
    }
  }

  return result;
}

export async function createFile(args: FileArgs & { content: string; encoding?: 'utf-8' | 'base64'; message?: string }) {
  const path = guard(args.owner, args.repo, args.path)!;
  const content = encodeContent(args.content, args.encoding ?? 'utf-8');
  const response = await octokit.repos.createOrUpdateFileContents({
    owner: args.owner,
    repo: args.repo,
    path,
    branch: branchOrDefault(args.branch),
    message: args.message || `Create ${path}`,
    content,
  });

  return { path, commitSha: response.data.commit.sha, contentSha: response.data.content?.sha };
}

export async function updateFile(args: FileArgs & { content: string; sha?: string; encoding?: 'utf-8' | 'base64'; message?: string }) {
  const path = guard(args.owner, args.repo, args.path)!;
  const currentSha = args.sha || (await readFile({ owner: args.owner, repo: args.repo, branch: args.branch, path })).sha;
  const content = encodeContent(args.content, args.encoding ?? 'utf-8');
  const response = await octokit.repos.createOrUpdateFileContents({
    owner: args.owner,
    repo: args.repo,
    path,
    branch: branchOrDefault(args.branch),
    message: args.message || `Update ${path}`,
    content,
    sha: currentSha,
  });

  return { path, commitSha: response.data.commit.sha, contentSha: response.data.content?.sha };
}

export async function deleteFile(args: FileArgs & { sha?: string; message?: string }) {
  const path = guard(args.owner, args.repo, args.path)!;
  const currentSha = args.sha || (await readFile({ owner: args.owner, repo: args.repo, branch: args.branch, path })).sha;
  const response = await octokit.repos.deleteFile({
    owner: args.owner,
    repo: args.repo,
    path,
    branch: branchOrDefault(args.branch),
    message: args.message || `Delete ${path}`,
    sha: currentSha,
  });

  return { path, commitSha: response.data.commit.sha };
}

export async function moveFile(args: BaseArgs & { fromPath: string; toPath: string; message?: string }) {
  const fromPath = guard(args.owner, args.repo, args.fromPath)!;
  const toPath = guard(args.owner, args.repo, args.toPath)!;
  const file = await readFile({ owner: args.owner, repo: args.repo, branch: args.branch, path: fromPath });
  const created = await createFile({
    owner: args.owner,
    repo: args.repo,
    branch: args.branch,
    path: toPath,
    content: file.contentBase64,
    encoding: 'base64',
    message: args.message || `Move ${fromPath} to ${toPath}`,
  });
  const deleted = await deleteFile({
    owner: args.owner,
    repo: args.repo,
    branch: args.branch,
    path: fromPath,
    sha: file.sha,
    message: args.message || `Remove ${fromPath} after move`,
  });

  return { fromPath, toPath, createCommitSha: created.commitSha, deleteCommitSha: deleted.commitSha };
}

export async function fileHistory(args: FileArgs & { perPage?: number }) {
  const path = guard(args.owner, args.repo, args.path)!;
  const response = await octokit.repos.listCommits({
    owner: args.owner,
    repo: args.repo,
    path,
    sha: branchOrDefault(args.branch),
    per_page: args.perPage ?? 10,
  });

  return response.data.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: commit.commit.author,
    url: commit.html_url,
  }));
}
