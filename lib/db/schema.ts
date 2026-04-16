import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  jsonb,
  integer,
  real,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import type { FillInContent, OrderContent, MultiSelectContent, ColorLabelContent } from './types'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const exerciseTypeEnum = pgEnum('exercise_type', ['FILL_IN', 'ORDER', 'MULTI_SELECT', 'COLOR_LABEL'])

export const fsrsStateEnum = pgEnum('fsrs_state', [
  'NEW',
  'LEARNING',
  'REVIEW',
  'RELEARNING',
])

// ---------------------------------------------------------------------------
// token_types  (flexible — you can INSERT new types at will)
// ---------------------------------------------------------------------------
export const tokenTypes = pgTable('token_types', {
  id:          uuid('id').primaryKey().defaultRandom(),
  label:       text('label').notNull(),
  description: text('description'),
  color:       varchar('color', { length: 16 }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// tokens  (first-class linguistic fragments)
// ---------------------------------------------------------------------------
export const tokens = pgTable('tokens', {
  id:        uuid('id').primaryKey().defaultRandom(),
  text:      text('text').notNull(),
  typeId:    uuid('type_id').notNull().references(() => tokenTypes.id),
  notes:     text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// sentences  (source sentences that tokens belong to)
// ---------------------------------------------------------------------------
export const sentences = pgTable('sentences', {
  id:        uuid('id').primaryKey().defaultRandom(),
  fullText:  text('full_text').notNull(),
  language:  varchar('language', { length: 8 }).notNull().default('de'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// sentence_tokens  (ordered tokens within a sentence)
// ---------------------------------------------------------------------------
export const sentenceTokens = pgTable('sentence_tokens', {
  id:         uuid('id').primaryKey().defaultRandom(),
  sentenceId: uuid('sentence_id').notNull().references(() => sentences.id, { onDelete: 'cascade' }),
  tokenId:    uuid('token_id').notNull().references(() => tokens.id),
  position:   integer('position').notNull(),
}, (t) => [
  uniqueIndex('uq_sentence_position').on(t.sentenceId, t.position),
])

// ---------------------------------------------------------------------------
// exercises
// `content` is a typed JSON blob — parse it with ExerciseContent (types.ts).
// Content now holds TOKEN IDs, not raw strings.
// ---------------------------------------------------------------------------
export const exercises = pgTable('exercises', {
  id:         uuid('id').primaryKey().defaultRandom(),
  type:       exerciseTypeEnum('type').notNull(),
  sentenceId: uuid('sentence_id').references(() => sentences.id, { onDelete: 'set null' }),
  content:    jsonb('content').notNull().$type<FillInContent | OrderContent | MultiSelectContent | ColorLabelContent>(),
  active:     boolean('active').notNull().default(true),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// token_knowledge  (one row per token — FSRS lives here, not on exercises)
// ---------------------------------------------------------------------------
export const tokenKnowledge = pgTable('token_knowledge', {
  id:         uuid('id').primaryKey().defaultRandom(),
  tokenId:    uuid('token_id').notNull().references(() => tokens.id, { onDelete: 'cascade' }),

  state:      fsrsStateEnum('state').notNull().default('NEW'),
  stability:  real('stability').notNull().default(0),
  difficulty: real('difficulty').notNull().default(0),
  reps:       integer('reps').notNull().default(0),
  lapses:     integer('lapses').notNull().default(0),

  lastReview: timestamp('last_review', { withTimezone: true }),
  nextReview: timestamp('next_review', { withTimezone: true }),

  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uq_token_knowledge_token_id').on(t.tokenId),
  index('idx_token_knowledge_next_review').on(t.nextReview),
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
// session_exercises  (per-attempt record — score is exercise-level pass/fail)
// ---------------------------------------------------------------------------
export const sessionExercises = pgTable('session_exercises', {
  id:         uuid('id').primaryKey().defaultRandom(),
  sessionId:  uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  score:      real('score').notNull(),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const tokenTypesRelations = relations(tokenTypes, ({ many }) => ({
  tokens: many(tokens),
}))

export const tokensRelations = relations(tokens, ({ one }) => ({
  type:      one(tokenTypes,     { fields: [tokens.typeId], references: [tokenTypes.id] }),
  knowledge: one(tokenKnowledge, { fields: [tokens.id],     references: [tokenKnowledge.tokenId] }),
}))

export const sentencesRelations = relations(sentences, ({ many }) => ({
  sentenceTokens: many(sentenceTokens),
  exercises:      many(exercises),
}))

export const sentenceTokensRelations = relations(sentenceTokens, ({ one }) => ({
  sentence: one(sentences, { fields: [sentenceTokens.sentenceId], references: [sentences.id] }),
  token:    one(tokens,    { fields: [sentenceTokens.tokenId],    references: [tokens.id] }),
}))

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  sentence:         one(sentences, { fields: [exercises.sentenceId], references: [sentences.id] }),
  sessionExercises: many(sessionExercises),
}))

export const tokenKnowledgeRelations = relations(tokenKnowledge, ({ one }) => ({
  token: one(tokens, { fields: [tokenKnowledge.tokenId], references: [tokens.id] }),
}))

export const sessionsRelations = relations(sessions, ({ many }) => ({
  sessionExercises: many(sessionExercises),
}))

export const sessionExercisesRelations = relations(sessionExercises, ({ one }) => ({
  session:  one(sessions,  { fields: [sessionExercises.sessionId],  references: [sessions.id] }),
  exercise: one(exercises, { fields: [sessionExercises.exerciseId], references: [exercises.id] }),
}))
