# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personality Planet: Awakening (性格星球：觉醒计划) — an MBTI personality test platform for middle-school students and teachers. Features a standard 93-question assessment, a gamified AVG (adventure/visual-novel) mode, teacher dashboards, and a science literacy library.

## Commands

All commands run from the repo root. Requires pnpm 10.33 and Docker.

```bash
# Environment setup
docker compose up -d          # Start Postgres (5432) + Redis (6379)
pnpm db:migrate               # Run Prisma migrations
pnpm db:generate              # Generate Prisma client

# Development
pnpm dev:web                  # Next.js frontend on :3000
pnpm dev:api                  # NestJS backend on :3001 (watch mode)

# Build
pnpm build                    # Build all apps

# Testing
pnpm test                     # API unit tests (Jest)
pnpm test:unit                # API + Web unit tests (Jest + Vitest)
pnpm test:integration         # API E2E tests (Jest + supertest)
pnpm test:e2e                 # Playwright browser E2E tests
pnpm test:e2e:install         # Install Chromium for Playwright
pnpm test:gate                # Full CI gate: build + lint + format:check + unit + integration

# Lint & Format
pnpm lint                     # ESLint across all packages
pnpm format                   # Prettier auto-fix
pnpm format:check             # Prettier check (no write)
pnpm gate:static              # Build + lint + format:check

# Database
pnpm db:validate              # Validate Prisma schema
pnpm db:push                  # Push schema without migration
```

## Architecture

### Monorepo (pnpm workspaces)

```
apps/web/    → Next.js 14 App Router (React 18, TypeScript, TailwindCSS, Shadcn/UI)
apps/api/    → NestJS 10 (TypeScript, JWT auth, Swagger)
prisma/      → Single Prisma schema at repo root, shared by both apps
e2e/         → Playwright E2E tests
```

### Frontend (`apps/web`) — port 3000

- **Pages**: Home (`/`), Standard test (`/test/standard`), AVG adventure test (`/test/avg`), Report (`/report`)
- **State**: Custom React hooks (`use-avg-test`, `use-standard-test`, `use-sprite-interaction`) — no global store
- **API client**: `lib/progress-api.ts` + `lib/api-base.ts` talk to NestJS backend
- **Guest identity**: `lib/guest-session-id.ts` manages anonymous `session_id`
- **Scoring**: `lib/report-scoring.ts` does client-side MBTI computation for report display
- **Theming**: `next-themes` + Shadcn CSS variables (dark/light via `class` strategy)
- **Charts**: Recharts for radar charts in reports

### Backend (`apps/api`) — port 3001

Four NestJS modules:

1. **PrismaModule** — DB connection service
2. **AuthModule** — Register/login, JWT issuance/validation, bcrypt hashing
3. **ProgressModule** — CRUD for in-progress test sessions (`TemporarySession`), optimistic locking via `progress_revision`
4. **ScoringModule** — MBTI engine: accumulates weighted signals across 4 dimensions (E/I, S/N, T/F, J/P), maps to 16 types

### Database (Prisma + PostgreSQL)

12 models in `prisma/schema.prisma`. Key entities:

- `User` (STUDENT/TEACHER/ADMIN roles)
- `TestClass` (classrooms with 6-digit invite codes)
- `TestResult` (finalized MBTI results, JSON scores + type string)
- `TemporarySession` (in-progress assessments, dual-mode via `@@unique([userId, mode])`)
- `StandardQuestionnaire/Question/Option` (question bank)
- `AvgScript` (adventure scenario scripts with node JSON)

### Data Flow

1. Student starts test → gets guest `session_id`
2. Answers saved incrementally via `PUT /progress` with optimistic locking
3. On completion → server-side scoring via `POST /scoring/compute`
4. Result persisted to `TestResult` → displayed on `/report` with radar charts

## Code Conventions

- **Language**: Code comments and docs are in Chinese (中文). Use Chinese for new comments unless the file's existing comments are in English.
- **File headers**: Every hand-written source file (`.ts`, `.tsx`, `.css`, `schema.prisma`) starts with a brief comment describing the file's responsibility.
- **Key algorithms**: MBTI scoring logic must include comments explaining the psychological/PRD basis.
- **Formatting**: Prettier with semicolons, single quotes, trailing commas, 100-char width. Pre-commit hook runs `prettier --write` on staged files via Husky + lint-staged.
- **Style**: Simplicity first — minimum code that solves the problem. Surgical changes only when editing existing code. No speculative abstractions.

## Work Logs

- **目录**: `work-logs/`
- **命名规则**: `YYYY-MM-DD-工作日志.md`（日期在前，便于按时间排序）
- **内容**: 每次开发会话结束后生成，记录当日完成的任务、变更文件、测试结果和下一步计划
