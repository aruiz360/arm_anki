import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  integer,
  real,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import type { FillInContent, OrderContent } from './types'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const exerciseTypeEnum = pgEnum('exercise_type', ['FILL_IN', 'ORDER'])

export const fsrsStateEnum = pgEnum('fsrs_state', [
  'NEW',
  'LEARNING',
  'REVIEW',
  'RELEARNING',
])

// ---------------------------------------------------------------------------
// exercises
// `content` is a typed JSON blob — parse it with ExerciseContent (types.ts).
// ---------------------------------------------------------------------------
export const exercises = pgTable('exercises', {
  id:        uuid('id').primaryKey().defaultRandom(),
  type:      exerciseTypeEnum('type').notNull(),
  content:   jsonb('content').notNull().$type<FillInContent | OrderContent>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// exercise_knowledge  (one row per exercise — FSRS state)
// ---------------------------------------------------------------------------
export const exerciseKnowledge = pgTable('exercise_knowledge', {
  id:         uuid('id').primaryKey().defaultRandom(),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),

  // FSRS core fields
  state:      fsrsStateEnum('state').notNull().default('NEW'),
  stability:  real('stability').notNull().default(0),   // how long memory lasts (days)
  difficulty: real('difficulty').notNull().default(0),  // 0–1, learner-specific
  reps:       integer('reps').notNull().default(0),     // total review count
  lapses:     integer('lapses').notNull().default(0),   // times marked forgotten

  lastReview: timestamp('last_review', { withTimezone: true }),
  nextReview: timestamp('next_review', { withTimezone: true }),  // indexed — drives the queue

  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_exercise_knowledge_next_review').on(t.nextReview),
])

// ---------------------------------------------------------------------------
// sessions
// ---------------------------------------------------------------------------
export const sessions = pgTable('sessions', {
  id:         uuid('id').primaryKey().defaultRandom(),
  startedAt:  timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
})

// ---------------------------------------------------------------------------
// session_exercises  (join + per-attempt result)
// ---------------------------------------------------------------------------
export const sessionExercises = pgTable('session_exercises', {
  id:          uuid('id').primaryKey().defaultRandom(),
  sessionId:   uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  exerciseId:  uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  score:       real('score').notNull(),   // 0.0–1.0 — future-proof for gradient; currently 0 or 1
  answeredAt:  timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// Relations (for Drizzle relational queries)
// ---------------------------------------------------------------------------
export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  knowledge:       one(exerciseKnowledge, {
    fields: [exercises.id],
    references: [exerciseKnowledge.exerciseId],
  }),
  sessionExercises: many(sessionExercises),
}))

export const exerciseKnowledgeRelations = relations(exerciseKnowledge, ({ one }) => ({
  exercise: one(exercises, {
    fields: [exerciseKnowledge.exerciseId],
    references: [exercises.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ many }) => ({
  sessionExercises: many(sessionExercises),
}))

export const sessionExercisesRelations = relations(sessionExercises, ({ one }) => ({
  session:  one(sessions,  { fields: [sessionExercises.sessionId],  references: [sessions.id] }),
  exercise: one(exercises, { fields: [sessionExercises.exerciseId], references: [exercises.id] }),
}))
