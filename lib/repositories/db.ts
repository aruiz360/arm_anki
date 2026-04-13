import type { IExerciseRepository, Exercise } from './types'
import { ExerciseContent } from '../db/types'
import { db } from '../db'
import { exercises } from '../db/schema'

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
    // TODO: implement FSRS scheduling logic here
    // 1. fetch current exercise_knowledge row (or create if NEW)
    // 2. run FSRS algorithm with score to get new stability, difficulty, nextReview
    // 3. upsert exercise_knowledge
    console.log(`[db] recordScore — exerciseId: ${exerciseId}, score: ${score}`)
  }

  private parse(row: typeof exercises.$inferSelect): Exercise {
    const parsed = ExerciseContent.parse({ type: row.type, content: row.content })
    return { id: row.id, ...parsed }
  }
}
