# AI Bridge Task Ledger

> This file is the single task ledger for the AI Bridge project.
> It records confirmed scope, task status, outputs, gaps, and next actions.

## Project Goal

Build an AI Bridge service that allows GPT to operate GitHub repository files through a controlled API, avoiding repeated use of ChatGPT's built-in GitHub connector for write operations.

```text
GPT conversation
  -> GPT Actions
  -> AI Bridge API deployed on Tencent Cloud
  -> GitHub API with server-side GitHub Token
  -> GitHub repository files
```

## Confirmed Scope

- Files remain in GitHub.
- AI Bridge runs as an external service.
- GPT calls AI Bridge through GPT Actions.
- AI Bridge operates GitHub files with a server-side GitHub Token.
- v0.1 focuses on GitHub file operations, not full GitHub platform management.

## Supported v0.1 Capabilities

- List repository tree
- Read file
- Create file
- Update file
- Delete file
- Move / rename file in one Git commit
- Read file commit history
- Extract text from text files, PDF, DOCX, XLSX / XLS
- Extract DOCX embedded images
- Save DOCX extracted images to GitHub in one commit
- Preview image files as base64
- Replace text in text-readable files
- Create DOCX from plain text
- Update Excel cell
- Append Excel rows
- API Key authentication
- Repository allowlist
- Optional path prefix allowlist
- Docker deployment support
- Tencent Cloud deployment guide
- GPT Actions OpenAPI schema
- GitHub Actions CI for typecheck and build

## Task Table

| Task ID | Task | Role | Output | Status | Result / Notes |
|---|---|---|---|---|---|
| T-001 | Read task-system rules | PM | Confirm execution rules | Done | Confirmed task-ledger-first workflow and no extra process files rule. |
| T-002 | Confirm AI Bridge scope | PM / Architect | v0.1 scope | Done | Confirmed GitHub File Bridge, not Tencent Cloud storage or Feishu storage. |
| T-003 | Create Node/TypeScript project foundation | Builder | `package.json`, `tsconfig.json`, `.env.example` | Done | Basic Node/TypeScript service scaffold created. |
| T-004 | Add config and authentication | Builder | `src/config.ts`, `src/middleware/auth.ts`, `src/utils/pathGuard.ts` | Done | Added API key auth, repo allowlist, optional path prefix guard. |
| T-005 | Add GitHub file operation layer | Builder | `src/github/githubClient.ts`, `src/github/fileService.ts`, `src/routes/files.ts` | Done | Added tree, read, create, update, delete, move, history. |
| T-006 | Add content extraction | Builder | `src/content/contentService.ts`, `src/routes/content.ts` | Done | Added text, PDF, DOCX, Excel, image extraction. |
| T-007 | Add limited Word / Excel editing | Builder | `src/content/editService.ts`, `src/routes/edit.ts` | Done | Added text replacement, DOCX from text, Excel cell update, Excel row append. |
| T-008 | Mount service routes | Builder | `src/server.ts` | Done | Mounted files, content, and edit routes. |
| T-009 | Create README | Writer | `README.md` | Done | Added setup, API usage, safety, GPT Actions notes. |
| T-010 | Create OpenAPI schema | Builder | `openapi.yaml` | Done | Added GPT Actions schema for main API. |
| T-011 | Review code consistency | QA | Risk list | Done | Found type declaration, dynamic writer typing, and size-limit issues. |
| T-012 | Fix code consistency findings | Builder | Code fixes | Done | Added `@types/pdf-parse`, fixed edit service typing, enforced write size limits. |
| T-013 | Stage confirmation | User / PM | Continue decision | Done | User confirmed next stage. |
| T-014 | Add deployment and GPT Actions guide | Architect / Writer | `docs/deployment-and-gpt-actions.md` | Done | Added deployment and GPT Actions connection guide. |
| T-015 | Prepare Tencent Cloud deployment | DevOps | `Dockerfile`, `docker-compose.yml`, `docs/tencent-cloud-deployment.md` | Done | Added Docker deployment assets and Tencent Cloud guide. |
| T-016 | Tencent Cloud actual deployment | User / DevOps | Running AI Bridge service | Pending User | Requires CVM, environment variables, GitHub Token, API Key, domain/HTTPS. |
| T-017 | GPT Actions actual connection | User / GPT Config | Custom GPT Action | Pending User | Requires deployed HTTPS AI Bridge URL and API key setup. |
| T-018 | QA stability and usability review | QA | QA review | Done | Confirmed main path works conceptually; flagged P1 risks. |
| T-019-1 | Parameterize Excel preview | Builder | Excel `sheetName` / `maxRows` support | Done | Default 50 rows, configurable up to 500 rows. |
| T-019-2 | Extract DOCX images | Builder | `src/content/docxAssetService.ts`, route update | Done | Supports preview and save mode. |
| T-019-3 | Make move atomic | Builder | `moveFile` single-commit implementation | Done | Move / rename now uses Git Data API in one commit. |
| T-020 | QA re-review | QA | Updated QA review | Done | Version rated suitable for Tencent Cloud test deployment. |
| T-021-1 | Resolve DOCX image multi-commit risk | Builder | Single-commit batch file creation | Done | Added `createFilesInSingleCommit`; DOCX images now saved in one commit. |
| T-021-2 | Sync OpenAPI | Builder | Updated `openapi.yaml` | Done | Added Excel parameters and DOCX image extraction endpoint. |
| T-021-3 | Sync README | Writer | Updated `README.md` | Done | Documented latest API behavior and limits. |
| T-021-4 | Add CI build check | Builder | `.github/workflows/ci.yml` | Done | CI runs install, typecheck, and build on push/PR. |
| T-022 | Tencent Cloud deployment | User / DevOps | Running service URL | Todo | Next major execution task. |
| T-023 | Interface smoke test | QA | Test result | Todo | Test health, tree, read, create, update, delete, move, content extraction. |
| T-024 | GPT Actions integration test | QA / GPT Config | Action test result | Todo | Test GPT Action read/create/update/delete against safe path. |

## Open Gaps

| Gap ID | Description | Status | Notes |
|---|---|---|---|
| GAP-005 | User's fifth PM/design feedback item was not provided. | Open | Waiting for user to add it if still needed. |
| GAP-DEPLOY-001 | Tencent Cloud CVM not yet created/configured. | Open | Requires user action. |
| GAP-SECRET-001 | GitHub Token and BRIDGE_API_KEY not yet configured in runtime environment. | Open | Must not be committed to GitHub. |
| GAP-ACTIONS-001 | GPT Actions schema not yet imported and tested in Custom GPT. | Open | Requires deployed HTTPS domain first. |
| GAP-RUNTIME-001 | `npm install`, `npm run typecheck`, and `npm run build` have not yet been run in a real environment. | Open | CI has been added but actual run status still needs verification. |

## Current Readiness

| Area | Status | Notes |
|---|---|---|
| Code structure | Ready for test deployment | Core files created and reviewed. |
| GitHub file operations | Ready for test deployment | CRUD, history, and atomic move available. |
| Office / image support | Ready for test deployment | Basic extraction and limited editing supported. |
| Documentation | Ready | README and deployment docs updated. |
| OpenAPI | Ready for first GPT Actions import | Needs real Custom GPT import test. |
| CI | Added | Needs actual run verification. |
| Tencent Cloud deployment | Pending | User must provide server/runtime setup. |
| GPT Actions | Pending | Requires deployed service URL. |

## Next Recommended Task

```text
T-022: Deploy AI Bridge on Tencent Cloud test environment.
```

Recommended execution order:

1. Create Tencent Cloud CVM.
2. Install Docker and Docker Compose.
3. Clone repository.
4. Configure `.env` with `GITHUB_TOKEN`, `BRIDGE_API_KEY`, and allowlist.
5. Run `docker compose up -d --build`.
6. Test `/health`.
7. Test safe GitHub file CRUD in a temporary path.
8. Configure HTTPS domain.
9. Import `openapi.yaml` into GPT Actions.
10. Run GPT Actions smoke test.
