import type { IExerciseRepository, Exercise, ExerciseWithProgress } from './types'
import type { FillInContent, OrderContent } from '../db/types'
import data from '../mocks/data.json'

// ---------------------------------------------------------------------------
// Raw types matching the mock JSON (storage shape, token IDs)
// ---------------------------------------------------------------------------
type RawToken = { id: string; text: string; typeId: string }

type RawExercise =
  | { id: string; type: 'FILL_IN'; content: FillInContent }
  | { id: string; type: 'ORDER';   content: OrderContent }

const tokens     = data.tokens     as RawToken[]
const rawExercises = data.exercises as RawExercise[]

// Build a lookup: tokenId → text
const textById: Record<string, string> = Object.fromEntries(
  tokens.map((t) => [t.id, t.text])
)

function resolve(id: string): string {
  const text = textById[id]
  if (text === undefined) throw new Error(`Unknown token id in mock data: ${id}`)
  return text
}

// ---------------------------------------------------------------------------
// Storage → display conversion (token IDs → text)
// ---------------------------------------------------------------------------
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
  return {
    id: ex.id,
    type: 'ORDER',
    content: {
      tokens:         ex.content.tokenIds.map(resolve),
      validOrderings: ex.content.validOrderings.map((ordering) => ordering.map(resolve)),
    },
  }
}

const exercises: Exercise[] = rawExercises.map(toDisplay)

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
export class MockExerciseRepository implements IExerciseRepository {
  async getNextExercise(): Promise<Exercise | null> {
    if (exercises.length === 0) return null
    return exercises[Math.floor(Math.random() * exercises.length)]
  }

  async getAll(): Promise<Exercise[]> {
    return exercises
  }

  async getAllWithProgress(): Promise<ExerciseWithProgress[]> {
    return exercises.map((ex) => ({ ...ex, reps: 0, lastReview: null }))
  }

  async recordScore(exerciseId: string, score: number): Promise<void> {
    const raw = rawExercises.find((ex) => ex.id === exerciseId)
    if (!raw) return

    // Fan out — in mock mode, just log which tokens would be updated.
    const tokenIds = raw.type === 'FILL_IN'
      ? raw.content.blanks.flatMap((b) => [...b.correctIds, ...b.distractorIds])
      : raw.content.tokenIds

    console.log(
      `[mock] recordScore — exercise: ${exerciseId}, score: ${score}, tokens affected: ${tokenIds.length}`
    )
  }
}
