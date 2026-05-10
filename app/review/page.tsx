import Link from 'next/link'
import { getExerciseRepository } from '@/lib/repositories'
import ReviewClient from './ReviewClient'

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const repo = getExerciseRepository()
  const { id } = await searchParams
  const exercise = id
    ? await repo.getById(id)
    : await repo.getNextExercise()

  return (
    <main className="min-h-screen bg-gray-50 flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review</h1>
        {exercise ? (
          <ReviewClient exercise={exercise} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center space-y-4">
            <p className="text-2xl">🎉</p>
            <p className="text-lg font-semibold text-gray-800">All caught up!</p>
            <p className="text-sm text-gray-500">No exercises due right now. Come back later.</p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors text-sm"
            >
              ← Home
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
