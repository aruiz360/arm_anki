'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FillInExercise from '@/components/exercises/FillInExercise'
import OrderExercise from '@/components/exercises/OrderExercise'
import type { Exercise } from '@/lib/repositories'

interface Props {
  exercise: Exercise
}

export default function ReviewClient({ exercise }: Props) {
  const router = useRouter()
  const [result, setResult] = useState<0 | 1 | null>(null)
  // Incrementing this key forces the exercise component to fully remount on Next,
  // wiping all answer state regardless of whether the same exercise comes back.
  const [reviewKey, setReviewKey] = useState(0)

  function handleResult(score: 0 | 1) {
    setResult(score)
    fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId: exercise.id, score }),
    }).catch(console.error) // fire-and-forget — don't block the UI
  }

  function next() {
    setResult(null)
    setReviewKey((k) => k + 1)
    router.refresh()
  }

  return (
    <div className="space-y-10">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Home
        </Link>
        <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-gray-100 text-gray-500">
          {exercise.type === 'FILL_IN' ? 'Fill in the blanks' : 'Order the sentence'}
        </span>
      </div>

      {/* Exercise — keyed on both reviewKey and exercise.id:
            - reviewKey changes on Next click → immediate remount (blank state while server responds)
            - exercise.id changes when server returns new exercise → remount with correct content
            Both together prevent stale state/content mismatches. */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {exercise.type === 'FILL_IN' && (
          <FillInExercise
            key={`${reviewKey}-${exercise.id}`}
            id={exercise.id}
            content={exercise.content}
            onResult={handleResult}
          />
        )}
        {exercise.type === 'ORDER' && (
          <OrderExercise
            key={`${reviewKey}-${exercise.id}`}
            id={exercise.id}
            content={exercise.content}
            onResult={handleResult}
          />
        )}
      </div>

      {/* Result + Next — appears after answering */}
      {result !== null && (
        <div className="flex items-center gap-4">
          <span className={`text-lg font-semibold ${result === 1 ? 'text-green-600' : 'text-red-500'}`}>
            {result === 1 ? 'Correct!' : 'Not quite.'}
          </span>
          <button
            onClick={next}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
