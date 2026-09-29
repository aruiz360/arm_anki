# Anki: German Grammar Drills

An interactive practice app for German that goes beyond flip-the-card flashcards. Instead of asking
"do you remember this word?", every exercise makes you **use** the word inside a real sentence:
pick the right verb form, put the words in the right order, or label which part of the sentence is
the dative object.

Built with **React 19** and **Next.js 16** (App Router), TypeScript, Tailwind CSS 4, and Zod.

> Status: working prototype. The four exercise types, the review flow, and the API are done. Content
> is served from a local JSON file; a PostgreSQL + FSRS backend was built and then removed to
> iterate on the UI faster (see [Roadmap](#roadmap)).

## Why

Classic flashcards (including the original [Anki](https://apps.ankiweb.net/)) are great for
vocabulary, but German's hard parts are grammatical: verb conjugation, word order (verb in second
position, subordinate clauses), and case (Nominativ / Akkusativ / Dativ). Those only make sense in
context, so this app builds every exercise out of full sentences.

The long-term idea: track what you know **per word**, not per card. Every exercise is made of
shared tokens ("ist", "komme", "Am Montag"), so getting "ist" right in one exercise counts toward
your knowledge of "ist" everywhere, and a spaced-repetition scheduler (FSRS) decides which
sentences to show next.

## Exercise types

| Type | What you do | Example |
| --- | --- | --- |
| **Fill in** (`FILL_IN`) | Pick the right word for each blank from a shuffled set of options. A blank can accept more than one correct answer. | *Ich ___ Andres und ich bin 27 Jahre ___.* → `heisse` / `bin`, `alt` |
| **Order** (`ORDER`) | Tap tokens to build the sentence. Multiple valid orderings are accepted, since German word order is flexible. | `Am Montag` `gehe` `ich` `in die Schule` `.` |
| **Multi-select** (`MULTI_SELECT`) | Select every option that answers the prompt, and none of the distractors. Missed answers are shown in amber. | *Warum gehst du auf die Networking-Veranstaltung?* |
| **Color label** (`COLOR_LABEL`) | Pick a category (e.g. *Dativ*, *Akkusativ*, *Angabe*), then tap the parts of the sentence that belong to it. Wrong labels show the correct one underneath. | *Ich habe **ihm** **gleich spontan** **ein paar Akkorde** …* |

Every exercise is scored pass/fail (`0 | 1`) and posted to the API.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Route Handlers) |
| UI | **[React 19](https://react.dev)**: function components with hooks |
| Language | TypeScript 5 (strict) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) via PostCSS |
| Validation | [Zod 4](https://zod.dev) on the API boundary |
| Data | Local JSON (`lib/mocks/data.json`) behind a repository interface |
| Tooling | ESLint 9 (`eslint-config-next`) |

## Getting started

Requires Node.js 20+. No database or environment variables are needed.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## How it works

```
Browser                          Next.js server
───────                          ──────────────
/            ───────────────▶    app/page.tsx (Server Component)
                                   └─ repo.getAllWithProgress() → progress list

/review[?id] ───────────────▶    app/review/page.tsx (Server Component)
                                   └─ repo.getById(id) or repo.getNextExercise()
                                        │
             ◀── exercise ──────────────┘
ReviewClient (Client Component)
  └─ <FillIn | Order | MultiSelect | ColorLabel Exercise>
        │ onResult(0 | 1)
        ▼
POST /api/review { exerciseId, score } ─▶ app/api/review/route.ts
                                            └─ Zod validates → repo.recordScore()
"Next →" ─▶ router.refresh() re-runs the server page and fetches another exercise
```

- **Server Components fetch, Client Components interact.** Pages read from the repository on the
  server; only the exercise UI ships as client-side React.
- **Fire-and-forget scoring.** The score POST doesn't block the UI, so feedback is instant.
- **Clean remounts.** Each exercise is keyed on `${reviewKey}-${exercise.id}`, so pressing *Next*
  wipes all local answer state even if the same exercise comes back.

### Repository pattern

All data access goes through one interface (`lib/repositories/types.ts`):

```ts
interface IExerciseRepository {
  getNextExercise(): Promise<Exercise | null>
  getById(id: string): Promise<Exercise | null>
  getAll(): Promise<Exercise[]>
  getAllWithProgress(): Promise<ExerciseWithProgress[]>
  recordScore(exerciseId: string, score: number): Promise<void>
}
```

`getExerciseRepository()` returns the JSON-backed `MockExerciseRepository` today. Pages and the API
never touch storage directly, so a database implementation can be dropped back in without changing
any UI code.

## Content model

Content lives in [`lib/mocks/data.json`](lib/mocks/data.json) and has three parts:

**Token types**: grammatical categories with a display color.

```json
{ "id": "tt-verb", "label": "Verb", "color": "#10b981" }
```

**Tokens**: every word or phrase, defined once and referenced by ID. Multi-word chunks like
`"Am Montag"` or `"in die Schule"` are single tokens so they move together in ORDER exercises.

```json
{ "id": "tk-komme", "text": "komme", "typeId": "tt-verb" }
```

**Exercises**: reference tokens by ID. The repository resolves IDs to text before the UI sees them,
and throws on unknown IDs so broken content fails loudly.

```json
{
  "id": "ex-fill-2",
  "type": "FILL_IN",
  "content": {
    "prompt": "Ich [[1]] aus Deutschland. Wo [[2]] du?",
    "blanks": [
      { "correctIds": ["tk-komme"],  "distractorIds": ["tk-gehe", "tk-fahre"] },
      { "correctIds": ["tk-kommst"], "distractorIds": ["tk-gehst", "tk-bist"] }
    ]
  }
}
```

| Type | `content` shape |
| --- | --- |
| `FILL_IN` | `prompt` with 1-based `[[n]]` placeholders; `blanks[]` of `{ correctIds, distractorIds }` |
| `ORDER` | `tokenIds` (the pool); `validOrderings` (every accepted sequence of token IDs) |
| `MULTI_SELECT` | `prompt`; `correctIds`; `distractorIds` |
| `COLOR_LABEL` | `tokens[]` of `{ id, categoryId }` (`null` = context, not a target); `categories[]` of `{ id, label, color }` |

### Adding an exercise

1. Add any new words to `tokens` (reuse existing IDs where possible; that's the point).
2. Append the exercise to `exercises` using the shape above.
3. Run `npm run dev`; a typo'd token ID throws with the offending ID in the message.

## Project structure

```
app/
  page.tsx                  Home: due count, "Start Review", progress checklist
  review/page.tsx           Loads one exercise (by ?id= or random)
  review/ReviewClient.tsx   Renders the exercise, posts the score, handles "Next"
  api/review/route.ts       POST { exerciseId, score } — Zod-validated
components/
  ProgressList.tsx          Exercise checklist with previews and type badges
  exercises/                One component per exercise type
lib/
  repositories/types.ts     Display types + IExerciseRepository
  repositories/mock.ts      JSON-backed repository (resolves token IDs → text)
  repositories/index.ts     getExerciseRepository() — the swap point
  mocks/data.json           Token types, tokens, exercises
```

## Roadmap

- [ ] **Bring back persistence.** A PostgreSQL + Drizzle ORM layer (tables for tokens, sentences,
      exercises, sessions, and per-token knowledge) existed before commit `e7f396f` and can be
      restored behind the same repository interface.
- [ ] **FSRS scheduling per token.** Track `state`, `stability`, `difficulty`, `reps`, and `lapses`
      for each token, and pick the next exercise from the tokens most due for review. Today
      `getNextExercise()` is random and `recordScore()` only logs.
- [ ] Real progress on the home page (currently always 0 reviewed, since the mock doesn't persist).
- [ ] Partial credit (e.g. 2 of 3 blanks correct) instead of pass/fail.
- [ ] Content authoring: generate exercises from a German sentence, or import from a word list.
- [ ] Tests for the scoring logic in each exercise component.

