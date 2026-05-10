import type { IExerciseRepository } from './types'
import { MockExerciseRepository } from './mock'

export function getExerciseRepository(): IExerciseRepository {
  return new MockExerciseRepository()
}

export type {
  IExerciseRepository,
  Exercise,
  ExerciseWithProgress,
  FillInDisplay,
  OrderDisplay,
  MultiSelectDisplay,
  ColorLabelDisplay,
} from './types'
