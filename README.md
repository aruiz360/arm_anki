# Anki — German Vocabulary Flashcards

Spaced repetition app for German vocabulary and grammar. Built with Next.js, Drizzle ORM, and PostgreSQL.

## Exercise Types

| Type | Description |
|------|-------------|
| `FILL_IN` | Fill blanks with correct word choices |
| `ORDER` | Arrange tokens into correct sentence order |
| `MULTI_SELECT` | Select all correct options from a pool |
| `COLOR_LABEL` | Classify tokens by grammatical category |

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Drizzle ORM** + **PostgreSQL**
- **Tailwind CSS v4**
- **Zod** for exercise content validation

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL

# Run migrations
npx drizzle-kit migrate

# Seed database
npm run db:seed

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `MOCKING_DATA` | Set to `TRUE` to use local mock data (skips DB) |

## Development

```bash
npm run dev       # dev server
npm run build     # production build
npm run lint      # ESLint
npm run db:seed   # seed database from lib/mocks/data.json
```

## Architecture

```
app/                  # Next.js App Router pages & API routes
  api/review/         # POST endpoint to record exercise scores
  review/             # Review session UI
components/
  exercises/          # One component per exercise type
lib/
  db/                 # Drizzle client, schema, Zod content types
  repositories/       # IExerciseRepository interface + DB/mock implementations
  mocks/              # Mock data (data.json) for local development
drizzle/
  seed.ts             # Database seeder
```

## Root Files

| File | Purpose |
|------|---------|
| `.env` | Active environment variables (not committed) |
| `.env.example` | Template for required env vars |
| `.gitignore` | Git exclusions |
| `AGENTS.md` | Notes for AI agents about Next.js version quirks |
| `CLAUDE.md` | Development guidelines for Claude Code |
| `drizzle.config.ts` | Drizzle Kit config — DB connection + migration output path |
| `eslint.config.mjs` | ESLint rules (flat config format) |
| `next-env.d.ts` | Auto-generated Next.js TypeScript declarations — do not edit |
| `next.config.ts` | Next.js config |
| `package.json` | Dependencies and npm scripts |
| `package-lock.json` | Lockfile |
| `postcss.config.mjs` | PostCSS config for Tailwind CSS v4 |
| `tsconfig.json` | TypeScript compiler options |
| `tsconfig.tsbuildinfo` | Incremental build cache — do not commit |

## Data Model

Token knowledge (stability, difficulty, repetitions, next review) is tracked per token using FSRS fields. An exercise is considered complete when all its tokens have been reviewed at least once.
