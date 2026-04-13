import type { IExerciseRepository } from './types'
import { MockExerciseRepository } from './mock'
import { DbExerciseRepository } from './db'

export function getExerciseRepository(): IExerciseRepository {
  if (process.env.MOCKING_DATA === 'TRUE') {
    return new MockExerciseRepository()
  }
  return new DbExerciseRepository()
}

export type { IExerciseRepository, Exercise } from './types'
