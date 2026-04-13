import Link from 'next/link'
import { getExerciseRepository } from '@/lib/repositories'
import ProgressList from '@/components/ProgressList'

export default async function HomePage() {
  const repo = getExerciseRepository()
  const exercises = await repo.getAllWithProgress()

  const done = exercises.filter((ex) => ex.reps > 0).length
  const due  = exercises.filter((ex) => ex.reps === 0).length // simplified: not yet reviewed

  return (
    <main className="min-h-screen bg-gray-50 flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-2xl space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deutsch lernen</h1>
          <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest">
            {process.env.MOCKING_DATA === 'TRUE' ? 'mock data' : 'live db'}
          </p>
        </div>

        {/* Start Review CTA */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-800">
              {due > 0 ? `${due} exercise${due > 1 ? 's' : ''} to review` : 'All caught up!'}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              {done} of {exercises.length} completed
            </p>
          </div>
          {due > 0 && (
            <Link
              href="/review"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
            >
              Start Review →
            </Link>
          )}
        </div>

        {/* Progress checklist */}
        <ProgressList exercises={exercises} />

      </div>
    </main>
  )
}
