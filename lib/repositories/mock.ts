import type { IExerciseRepository, Exercise, ExerciseWithProgress } from './types'
import data from '../mocks/data.json'

// Raw storage shapes (token IDs, not resolved text)
type FillInContent     = { prompt: string; blanks: { correctIds: string[]; distractorIds: string[] }[] }
type OrderContent      = { validOrderings: string[][]; tokenIds: string[] }
type MultiSelectContent = { prompt: string; correctIds: string[]; distractorIds: string[] }
type ColorLabelContent = { tokens: { id: string; categoryId: string | null }[]; categories: { id: string; label: string; color: string }[] }

type RawToken = { id: string; text: string; typeId: string }

type RawExercise =
  | { id: string; type: 'FILL_IN';       content: FillInContent }
  | { id: string; type: 'ORDER';          content: OrderContent }
  | { id: string; type: 'MULTI_SELECT';   content: MultiSelectContent }
  | { id: string; type: 'COLOR_LABEL';    content: ColorLabelContent }

const tokens       = data.tokens     as RawToken[]
const rawExercises = data.exercises  as RawExercise[]

const textById: Record<string, string> = Object.fromEntries(
  tokens.map((t) => [t.id, t.text])
)

function resolve(id: string): string {
  const text = textById[id]
  if (text === undefined) throw new Error(`Unknown token id in mock data: ${id}`)
  return text
}

function toDisplay(ex: RawExercise): Exercise {
  if (ex.type === 'FILL_IN') {
    return {
      id: ex.id,
      type: 'FILL_IN',
      content: {
        prompt: ex.content.prompt,
        blanks: ex.content.blanks.map((b) => ({
          correct:     b.correctIds.map(resolve),
          distractors: b.distractorIds.map(resolve),
        })),
      },
    }
  }
  if (ex.type === 'ORDER') {
    return {
      id: ex.id,
      type: 'ORDER',
      content: {
        tokens:         ex.content.tokenIds.map(resolve),
        validOrderings: ex.content.validOrderings.map((o) => o.map(resolve)),
      },
    }
  }
  if (ex.type === 'MULTI_SELECT') {
    return {
      id: ex.id,
      type: 'MULTI_SELECT',
      content: {
        prompt:      ex.content.prompt,
        correct:     ex.content.correctIds.map(resolve),
        distractors: ex.content.distractorIds.map(resolve),
      },
    }
  }
  return {
    id: ex.id,
    type: 'COLOR_LABEL',
    content: {
      tokens:     ex.content.tokens.map((t) => ({ text: resolve(t.id), categoryId: t.categoryId })),
      categories: ex.content.categories,
    },
  }
}

const exercises: Exercise[] = rawExercises.map(toDisplay)

export class MockExerciseRepository implements IExerciseRepository {
  async getNextExercise(): Promise<Exercise | null> {
    if (exercises.length === 0) return null
    return exercises[Math.floor(Math.random() * exercises.length)]
  }

  async getById(id: string): Promise<Exercise | null> {
    return exercises.find((ex) => ex.id === id) ?? null
  }

  async getAll(): Promise<Exercise[]> {
    return exercises
  }

  async getAllWithProgress(): Promise<ExerciseWithProgress[]> {
    return exercises.map((ex) => ({ ...ex, reps: 0, lastReview: null, active: true }))
  }

  async recordScore(exerciseId: string, score: number): Promise<void> {
    const raw = rawExercises.find((ex) => ex.id === exerciseId)
    if (!raw) return
    const tokenIds =
      raw.type === 'FILL_IN'
        ? raw.content.blanks.flatMap((b) => [...b.correctIds, ...b.distractorIds])
        : raw.type === 'MULTI_SELECT'
          ? [...raw.content.correctIds, ...raw.content.distractorIds]
          : raw.type === 'COLOR_LABEL'
            ? raw.content.tokens.map((t) => t.id)
            : raw.content.tokenIds
    console.log(`[mock] recordScore — exercise: ${exerciseId}, score: ${score}, tokens: ${tokenIds.length}`)
  }
}
