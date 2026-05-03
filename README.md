# AI Bridge v0.1

AI Bridge is a GitHub File Bridge service. It lets GPT call a controlled API to read, create, update, delete, move, and inspect files in GitHub repositories, instead of using ChatGPT's built-in GitHub connector for every write operation.

## Goal

```text
GPT conversation
  -> AI Bridge API
  -> GitHub API
  -> GitHub repository files
```

The first version focuses on GitHub files only.

## Scope

### Supported in v0.1

- List repository tree
- Read files
- Create files
- Update files
- Delete files through Git commits
- Move / rename files
- Read file commit history
- Extract content from:
  - text files
  - PDF
  - DOCX
  - XLSX / XLS
  - images as base64 for downstream vision or preview tools
- Limited editing:
  - text replacement for text-readable files
  - create DOCX from plain text
  - update Excel cell
  - append Excel rows
- API key authentication
- Repository allowlist
- Optional path prefix allowlist

### Not supported in v0.1

- GitHub Issues / PR / Actions / Releases management
- Pixel-level image editing
- Native PDF in-place editing
- Complex Word formatting preservation
- Complex Excel formula/chart/pivot-table editing
- Large file workflows

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
BRIDGE_API_KEY=replace-with-a-long-random-secret
GITHUB_TOKEN=ghp_xxx
DEFAULT_OWNER=kelvin381539960-cyber
DEFAULT_BRANCH=main
ALLOWED_REPOS=kelvin381539960-cyber/Ai-bridge
ALLOWED_PATH_PREFIXES=
MAX_BATCH_OPERATIONS=20
MAX_TEXT_BYTES=1000000
MAX_BINARY_BYTES=5000000
```

Then run:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:3000/health
```

## Authentication

All `/api/*` endpoints require an API key.

Use either:

```http
x-bridge-api-key: your-key
```

or:

```http
Authorization: Bearer your-key
```

## Core API

### List tree

```http
GET /api/tree?owner=kelvin381539960-cyber&repo=Ai-bridge&path=src&recursive=true
```

### Read file

```http
GET /api/file?owner=kelvin381539960-cyber&repo=Ai-bridge&path=README.md
```

### Create file

```http
POST /api/file/create
```

```json
{
  "owner": "kelvin381539960-cyber",
  "repo": "Ai-bridge",
  "path": "docs/example.md",
  "content": "# Example",
  "encoding": "utf-8",
  "message": "Create example doc"
}
```

### Update file

```http
POST /api/file/update
```

```json
{
  "owner": "kelvin381539960-cyber",
  "repo": "Ai-bridge",
  "path": "docs/example.md",
  "content": "# Updated Example",
  "encoding": "utf-8",
  "message": "Update example doc"
}
```

### Delete file

```http
POST /api/file/delete
```

```json
{
  "owner": "kelvin381539960-cyber",
  "repo": "Ai-bridge",
  "path": "docs/example.md",
  "message": "Delete example doc"
}
```

### Move / rename file

```http
POST /api/file/move
```

```json
{
  "owner": "kelvin381539960-cyber",
  "repo": "Ai-bridge",
  "fromPath": "docs/old.md",
  "toPath": "docs/new.md",
  "message": "Rename doc"
}
```

### File history

```http
GET /api/file/history?owner=kelvin381539960-cyber&repo=Ai-bridge&path=README.md
```

## Content extraction

```http
GET /api/content/extract?owner=kelvin381539960-cyber&repo=Ai-bridge&path=some-file.pdf
```

Supported extraction behavior:

| Type | Behavior |
|---|---|
| Text | returns text |
| PDF | extracts text and page count |
| DOCX | extracts raw text |
| Excel | returns sheet names and first 50 preview rows |
| Image | returns base64 for downstream vision/preview tools |

## Limited editing

### Replace text

```http
POST /api/edit/text/replace
```

```json
{
  "owner": "kelvin381539960-cyber",
  "repo": "Ai-bridge",
  "path": "docs/example.md",
  "replacements": [{ "from": "old", "to": "new" }],
  "message": "Replace text"
}
```

### Create DOCX from text

```http
POST /api/edit/docx/from-text
```

```json
{
  "owner": "kelvin381539960-cyber",
  "repo": "Ai-bridge",
  "path": "docs/generated.docx",
  "text": "Paragraph one.\n\nParagraph two.",
  "message": "Create generated docx"
}
```

### Update Excel cell

```http
POST /api/edit/excel/update-cell
```

```json
{
  "owner": "kelvin381539960-cyber",
  "repo": "Ai-bridge",
  "path": "data/example.xlsx",
  "sheetName": "Sheet1",
  "cell": "A1",
  "value": "Updated",
  "message": "Update Excel cell"
}
```

### Append Excel rows

```http
POST /api/edit/excel/append-rows
```

```json
{
  "owner": "kelvin381539960-cyber",
  "repo": "Ai-bridge",
  "path": "data/example.xlsx",
  "sheetName": "Sheet1",
  "rows": [{ "Name": "Alice", "Status": "Done" }],
  "message": "Append Excel rows"
}
```

## Safety design

- `BRIDGE_API_KEY` protects the AI Bridge API.
- `ALLOWED_REPOS` limits which GitHub repositories can be modified.
- `ALLOWED_PATH_PREFIXES` optionally limits writable/readable paths.
- Git commits provide history and rollback capability.
- Updates use GitHub file SHA when available to reduce overwrite risk.

## GPT Actions

Use `openapi.yaml` as the schema for a Custom GPT Action. The Action should send `x-bridge-api-key` with each request.
