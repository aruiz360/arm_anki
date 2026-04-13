import type { IExerciseRepository, Exercise } from './types'
import { ExerciseContent } from '../db/types'
import { db } from '../db'
import { exercises, exerciseKnowledge } from '../db/schema'
import { sql } from 'drizzle-orm'

export class DbExerciseRepository implements IExerciseRepository {
  async getNextExercise(): Promise<Exercise | null> {
    // TODO: replace with FSRS queue logic (filter by nextReview <= now, ordered by nextReview)
    const rows = await db.select().from(exercises).limit(10)
    if (rows.length === 0) return null

    const row = rows[Math.floor(Math.random() * rows.length)]
    return this.parse(row)
  }

  async getAll(): Promise<Exercise[]> {
    const rows = await db.select().from(exercises)
    return rows.map((row) => this.parse(row))
  }

  async recordScore(exerciseId: string, score: number): Promise<void> {
    const now = new Date()

    // Placeholder scheduling: +1 day on correct, +10 min on wrong.
    // TODO: replace with real FSRS algorithm.
    const nextReview = new Date(
      now.getTime() + (score === 1 ? 24 * 60 * 60 * 1000 : 10 * 60 * 1000)
    )

    await db
      .insert(exerciseKnowledge)
      .values({
        exerciseId,
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
        target: exerciseKnowledge.exerciseId,
        set: {
          state:      'LEARNING',
          reps:       sql`${exerciseKnowledge.reps} + 1`,
          lapses:     score < 1
            ? sql`${exerciseKnowledge.lapses} + 1`
            : exerciseKnowledge.lapses,
          lastReview: now,
          nextReview,
          updatedAt:  now,
        },
      })
  }

  private parse(row: typeof exercises.$inferSelect): Exercise {
    const parsed = ExerciseContent.parse({ type: row.type, content: row.content })
    return { id: row.id, ...parsed }
  }
}
