import type { IExerciseRepository, Exercise, ExerciseWithProgress } from './types'
import type { FillInContent, OrderContent } from '../db/types'
import { ExerciseContent } from '../db/types'
import { db } from '../db'
import {
  exercises,
  tokens,
  tokenKnowledge,
} from '../db/schema'
import { sql, eq, inArray } from 'drizzle-orm'

type StoredExercise = {
  id: string
  type: 'FILL_IN' | 'ORDER'
  content: FillInContent | OrderContent
}

export class DbExerciseRepository implements IExerciseRepository {
  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  /**
   * Return a random exercise whose at least one token is due for review.
   * "Due" = token has no knowledge row, or nextReview is null or in the past.
   * Returns null when nothing is due (the UI shows "all caught up").
   */
  async getNextExercise(): Promise<Exercise | null> {
    const now = new Date()
    const allRows   = await db.select().from(exercises)
    const knowledge = await db.select().from(tokenKnowledge)

    const kByToken = new Map(knowledge.map((k) => [k.tokenId, k]))
    const isTokenDue = (tokenId: string) => {
      const k = kByToken.get(tokenId)
      return !k || !k.nextReview || k.nextReview <= now
    }

    const due = allRows.filter((row) => {
      const stored = this.asStored(row)
      return this.collectTokenIds(stored).some(isTokenDue)
    })

    if (due.length === 0) return null
    return this.hydrate(due[Math.floor(Math.random() * due.length)])
  }

  async getAll(): Promise<Exercise[]> {
    const rows = await db.select().from(exercises)
    return Promise.all(rows.map((row) => this.hydrate(row)))
  }

  /**
   * Progress is derived from token_knowledge:
   *   - reps       = minimum reps across the exercise's tokens
   *                  (exercise is "done" only when every token has ≥ 1 rep)
   *   - lastReview = max lastReview across its tokens
   */
  async getAllWithProgress(): Promise<ExerciseWithProgress[]> {
    const rows      = await db.select().from(exercises)
    const knowledge = await db.select().from(tokenKnowledge)
    const kByToken  = new Map(knowledge.map((k) => [k.tokenId, k]))

    const result: ExerciseWithProgress[] = []
    for (const row of rows) {
      const stored   = this.asStored(row)
      const tokenIds = this.collectTokenIds(stored)

      const tokenReps = tokenIds.map((id) => kByToken.get(id)?.reps ?? 0)
      const reps = tokenReps.length > 0 ? Math.min(...tokenReps) : 0

      const lastReviews = tokenIds
        .map((id) => kByToken.get(id)?.lastReview)
        .filter((d): d is Date => d != null)
      const lastReview = lastReviews.length > 0
        ? new Date(Math.max(...lastReviews.map((d) => d.getTime())))
        : null

      const hydrated = await this.hydrate(row)
      result.push({ ...hydrated, reps, lastReview })
    }
    return result
  }

  // -------------------------------------------------------------------------
  // Writes
  // -------------------------------------------------------------------------
  async recordScore(exerciseId: string, score: number): Promise<void> {
    const [row] = await db.select().from(exercises).where(eq(exercises.id, exerciseId))
    if (!row) throw new Error(`Exercise not found: ${exerciseId}`)

    const stored   = this.asStored(row)
    const tokenIds = this.collectTokenIds(stored)
    if (tokenIds.length === 0) return

    const now = new Date()
    // Placeholder scheduling — replace with FSRS.
    const nextReview = new Date(
      now.getTime() + (score === 1 ? 24 * 60 * 60 * 1000 : 10 * 60 * 1000)
    )

    // Fan out: upsert each token's knowledge row with the same score.
    for (const tokenId of tokenIds) {
      await db
        .insert(tokenKnowledge)
        .values({
          tokenId,
          state:      'LEARNING',
          stability:  score,
          difficulty: 1 - score,
          reps:       1,
          lapses:     score < 1 ? 1 : 0,
          lastReview: now,
          nextReview,
          updatedAt:  now,
        })
        .onConflictDoUpdate({
          target: tokenKnowledge.tokenId,
          set: {
            state:      'LEARNING',
            reps:       sql`${tokenKnowledge.reps} + 1`,
            lapses:     score < 1
              ? sql`${tokenKnowledge.lapses} + 1`
              : tokenKnowledge.lapses,
            lastReview: now,
            nextReview,
            updatedAt:  now,
          },
        })
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  private asStored(row: typeof exercises.$inferSelect): StoredExercise {
    const parsed = ExerciseContent.parse({ type: row.type, content: row.content })
    return { id: row.id, ...parsed }
  }

  private collectTokenIds(ex: StoredExercise): string[] {
    if (ex.type === 'FILL_IN') {
      return ex.content.blanks.flatMap((b) => [...b.correctIds, ...b.distractorIds])
    }
    return ex.content.tokenIds
  }

  private async hydrate(row: typeof exercises.$inferSelect): Promise<Exercise> {
    const stored = this.asStored(row)
    const ids    = this.collectTokenIds(stored)
    const tokenRows = ids.length > 0
      ? await db.select().from(tokens).where(inArray(tokens.id, ids))
      : []

    const textById = new Map(tokenRows.map((t) => [t.id, t.text]))
    const resolve = (id: string) => {
      const text = textById.get(id)
      if (text === undefined) throw new Error(`Unknown token id: ${id}`)
      return text
    }

    if (stored.type === 'FILL_IN') {
      return {
        id:   stored.id,
        type: 'FILL_IN',
        content: {
          prompt: stored.content.prompt,
          blanks: stored.content.blanks.map((b) => ({
            correct:     b.correctIds.map(resolve),
            distractors: b.distractorIds.map(resolve),
          })),
        },
      }
    }
    return {
      id:   stored.id,
      type: 'ORDER',
      content: {
        tokens:         stored.content.tokenIds.map(resolve),
        validOrderings: stored.content.validOrderings.map((o) => o.map(resolve)),
      },
    }
  }
}
