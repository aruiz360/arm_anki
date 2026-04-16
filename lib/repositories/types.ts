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

// MULTI_SELECT for the UI: all options combined (correct + distractors) are
// shuffled in the component; the component receives them split for evaluation.
export type MultiSelectDisplay = {
  prompt: string
  correct: string[]
  distractors: string[]
}

// COLOR_LABEL for the UI: tokens in sentence order, each with resolved text
// and its correct category (null = context, not a target).
// Categories carry the full label + hex color so the UI can render them.
export type ColorLabelDisplay = {
  tokens: Array<{
    text:       string
    categoryId: string | null
  }>
  categories: Array<{
    id:    string
    label: string
    color: string
  }>
}

export type Exercise =
  | { id: string; type: 'FILL_IN';       content: FillInDisplay }
  | { id: string; type: 'ORDER';          content: OrderDisplay }
  | { id: string; type: 'MULTI_SELECT';   content: MultiSelectDisplay }
  | { id: string; type: 'COLOR_LABEL';    content: ColorLabelDisplay }

// ---------------------------------------------------------------------------
// Exercise + review progress (for the checklist UI)
// With token-level FSRS, exercise "progress" is derived: reps = count of
// session_exercises rows for this exercise.
// ---------------------------------------------------------------------------
export type ExerciseWithProgress = Exercise & {
  reps: number
  lastReview: Date | null
  active: boolean
}

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------
export interface IExerciseRepository {
  getNextExercise(): Promise<Exercise | null>
  getById(id: string): Promise<Exercise | null>
  getAll(): Promise<Exercise[]>
  getAllWithProgress(): Promise<ExerciseWithProgress[]>
  recordScore(exerciseId: string, score: number): Promise<void>
}
