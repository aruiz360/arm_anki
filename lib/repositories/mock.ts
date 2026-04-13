import type { IExerciseRepository, Exercise } from './types'
import data from '../mocks/exercises.json'

const exercises = data as Exercise[]

export class MockExerciseRepository implements IExerciseRepository {
  async getNextExercise(): Promise<Exercise | null> {
    if (exercises.length === 0) return null
    const index = Math.floor(Math.random() * exercises.length)
    return exercises[index]
  }

  async getAll(): Promise<Exercise[]> {
    return exercises
  }

  async recordScore(exerciseId: string, score: number): Promise<void> {
    console.log(`[mock] recordScore — exerciseId: ${exerciseId}, score: ${score}`)
  }
}
