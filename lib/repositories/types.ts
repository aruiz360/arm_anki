// ---------------------------------------------------------------------------
// DISPLAY-FACING TYPES — what repository methods return to the UI layer.
// Token IDs from storage are pre-resolved to text so UI components stay simple.
// ---------------------------------------------------------------------------

export type TokenType = {
  id: string
  label: string
  color: string | null
}

export type Token = {
  id: string
  text: string
  type: TokenType
}

// FILL_IN for the UI: same shape as before — correct + distractors as strings.
export type FillInDisplay = {
  prompt: string
  blanks: { correct: string[]; distractors: string[] }[]
}

// ORDER for the UI: validOrderings as arrays of strings (one per accepted answer),
// tokens as the pool of strings to arrange.
export type OrderDisplay = {
  validOrderings: string[][]
  tokens: string[]
}

export type Exercise =
  | { id: string; type: 'FILL_IN'; content: FillInDisplay }
  | { id: string; type: 'ORDER';   content: OrderDisplay }

// ---------------------------------------------------------------------------
// Exercise + review progress (for the checklist UI)
// With token-level FSRS, exercise "progress" is derived: reps = count of
// session_exercises rows for this exercise.
// ---------------------------------------------------------------------------
export type ExerciseWithProgress = Exercise & {
  reps: number
  lastReview: Date | null
}

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------
export interface IExerciseRepository {
  getNextExercise(): Promise<Exercise | null>
  getAll(): Promise<Exercise[]>
  getAllWithProgress(): Promise<ExerciseWithProgress[]>
  recordScore(exerciseId: string, score: number): Promise<void>
}
