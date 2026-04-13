'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FillInExercise from '@/components/exercises/FillInExercise'
import OrderExercise from '@/components/exercises/OrderExercise'
import type { Exercise } from '@/lib/repositories'

interface Props {
  exercise: Exercise
}

export default function ReviewClient({ exercise }: Props) {
  const router = useRouter()
  const [result, setResult] = useState<0 | 1 | null>(null)

  function handleResult(score: 0 | 1) {
    setResult(score)
    fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId: exercise.id, score }),
    }).catch(console.error) // fire-and-forget — don't block the UI
  }

  function next() {
    router.refresh() // triggers the server component to fetch the next exercise
  }

  return (
    <div className="space-y-10">
      {/* Exercise type badge */}
      <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-gray-100 text-gray-500">
        {exercise.type === 'FILL_IN' ? 'Fill in the blanks' : 'Order the sentence'}
      </span>

      {/* Exercise */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {exercise.type === 'FILL_IN' && (
          <FillInExercise
            id={exercise.id}
            content={exercise.content}
            onResult={handleResult}
          />
        )}
        {exercise.type === 'ORDER' && (
          <OrderExercise
            id={exercise.id}
            content={exercise.content}
            onResult={handleResult}
          />
        )}
      </div>

      {/* Next button — appears after answering */}
      {result !== null && (
        <div className="flex items-center gap-4">
          <span className={`text-lg font-semibold ${result === 1 ? 'text-green-600' : 'text-red-500'}`}>
            {result === 1 ? 'Correct!' : 'Not quite.'}
          </span>
          <button
            onClick={next}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
