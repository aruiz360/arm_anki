import type { FillInContent, OrderContent } from '../db/types'

// ---------------------------------------------------------------------------
// Rich Exercise type — DB row + parsed content, discriminated on `type`.
// Safe to serialize and pass from server components to client components.
// ---------------------------------------------------------------------------
export type Exercise =
  | { id: string; type: 'FILL_IN'; content: FillInContent }
  | { id: string; type: 'ORDER';   content: OrderContent }

// ---------------------------------------------------------------------------
// Repository interface — swap implementations via MOCKING_DATA env var.
// ---------------------------------------------------------------------------
export interface IExerciseRepository {
  /** Return one exercise to review (random for now, queue logic comes later). */
  getNextExercise(): Promise<Exercise | null>

  /** Return all exercises (useful for browsing / dev). */
  getAll(): Promise<Exercise[]>

  /**
   * Record the result of a review attempt.
   * score: 0.0–1.0 (currently always 0 or 1)
   * The DB implementation will run FSRS and update exercise_knowledge.
   */
  recordScore(exerciseId: string, score: number): Promise<void>
}
