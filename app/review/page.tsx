import { getExerciseRepository } from '@/lib/repositories'
import ReviewClient from './ReviewClient'

export default async function ReviewPage() {
  const repo = getExerciseRepository()
  const exercise = await repo.getNextExercise()

  return (
    <main className="min-h-screen bg-gray-50 flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review</h1>
        <p className="text-sm text-gray-400 mb-10 uppercase tracking-widest">
          {process.env.MOCKING_DATA === 'TRUE' ? 'mock data' : 'live db'}
        </p>

        {exercise ? (
          <ReviewClient exercise={exercise} />
        ) : (
          <p className="text-gray-500">No exercises due. Come back later!</p>
        )}
      </div>
    </main>
  )
}
