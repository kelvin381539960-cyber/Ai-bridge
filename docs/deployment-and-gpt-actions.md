# AI Bridge Deployment and GPT Actions Guide

This guide explains how to deploy AI Bridge and connect it to GPT Actions so GPT can operate GitHub repository files through AI Bridge instead of using ChatGPT's built-in GitHub connector.

## Target Architecture

```text
GPT conversation
  -> GPT Actions
  -> AI Bridge public HTTPS API
  -> GitHub API with your GitHub token
  -> GitHub repository files
```

## Recommended Deployment Options

### Option A: Render

Recommended for the first deployment because it is simple and supports Node services directly.

Basic steps:

1. Create a new Web Service on Render.
2. Connect the `kelvin381539960-cyber/Ai-bridge` GitHub repository.
3. Set build command:

```bash
npm install && npm run build
```

4. Set start command:

```bash
npm start
```

5. Add environment variables from `.env.example`.
6. Deploy and copy the public HTTPS domain.

### Option B: Vercel

Vercel is possible, but the current Express server is a long-running Node server. Render or Railway is simpler for v0.1. If Vercel is required later, convert the API to serverless routes.

### Option C: Cloudflare Workers

Not recommended for v0.1 because the current service uses Node libraries for PDF, DOCX, and Excel parsing. Workers compatibility may require additional changes.

### Option D: Tencent Cloud / Aliyun Server

Suitable for long-term stable use.

Basic steps:

1. Create a lightweight Linux server.
2. Install Node.js 20+.
3. Clone this repository.
4. Configure `.env`.
5. Run with PM2 or Docker.
6. Bind HTTPS domain.

## Required Environment Variables

```env
PORT=3000
BRIDGE_API_KEY=replace-with-a-long-random-secret
GITHUB_TOKEN=github-token-with-repo-access
DEFAULT_OWNER=kelvin381539960-cyber
DEFAULT_BRANCH=main
ALLOWED_REPOS=kelvin381539960-cyber/Ai-bridge
ALLOWED_PATH_PREFIXES=
MAX_BATCH_OPERATIONS=20
MAX_TEXT_BYTES=1000000
MAX_BINARY_BYTES=5000000
```

## GitHub Token Requirements

Create a GitHub token for AI Bridge. Prefer a Fine-grained Personal Access Token.

Minimum scope:

```text
Repository contents: Read and write
Metadata: Read
```

Restrict the token to only the repositories AI Bridge should operate.

Do not put the token in GPT, README, OpenAPI, or chat messages. Store it only as a server environment variable.

## API Key Requirement

`BRIDGE_API_KEY` protects AI Bridge itself.

GPT Actions should send this header in every request:

```http
x-bridge-api-key: YOUR_BRIDGE_API_KEY
```

Use a long random secret.

## Configure GPT Actions

1. Deploy AI Bridge and get the public HTTPS URL.
2. Open `openapi.yaml`.
3. Replace:

```yaml
servers:
  - url: https://YOUR_DEPLOYED_AI_BRIDGE_DOMAIN
```

with your deployed domain, for example:

```yaml
servers:
  - url: https://ai-bridge.example.com
```

4. Create or edit a Custom GPT.
5. Add an Action.
6. Paste the updated OpenAPI schema.
7. Configure authentication to send the API key header:

```text
x-bridge-api-key: YOUR_BRIDGE_API_KEY
```

8. Save and test `/health`, then test `readFile` on a safe repository file.

## Suggested GPT Instruction

Add this to the GPT instructions that will use AI Bridge:

```text
When the user asks to create, read, update, delete, move, inspect, or extract content from GitHub repository files, use AI Bridge Actions instead of the built-in GitHub connector when available.

Before destructive or broad changes, summarize the intended operation and ask for confirmation.

Prefer file paths and repository names explicitly provided by the user. If ambiguous, ask for clarification.

Do not expose GITHUB_TOKEN or BRIDGE_API_KEY.
```

## First Test Flow

After deployment, test in this order:

1. `GET /health`
2. `GET /api/tree` on an allowed repo
3. `GET /api/file` on `README.md`
4. `POST /api/file/create` in a safe test path, such as `tmp/ai-bridge-test.md`
5. `POST /api/file/update` on that test file
6. `POST /api/file/delete` on that test file

## Safety Rules

- Use `ALLOWED_REPOS` to restrict repositories.
- Use `ALLOWED_PATH_PREFIXES` if you want to restrict paths.
- Use separate tokens for production and testing.
- Keep `MAX_TEXT_BYTES` and `MAX_BINARY_BYTES` conservative.
- Avoid broad delete operations in v0.1.
- Rely on Git commits for rollback.

## Known Limits in v0.1

- No GitHub Issues / PR / Actions / Releases management.
- No pixel-level image editing.
- No native PDF in-place editing.
- DOCX editing is limited to creating from text, not preserving complex original formatting.
- Excel editing supports basic cell updates and appending rows, not complex formulas, charts, or pivot tables.
