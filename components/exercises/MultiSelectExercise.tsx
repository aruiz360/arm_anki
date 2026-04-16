'use client'

import { useState, useMemo } from 'react'
import type { MultiSelectDisplay } from '@/lib/repositories'

interface Props {
  id: string
  content: MultiSelectDisplay
  onResult: (score: 0 | 1) => void
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function MultiSelectExercise({ id, content, onResult }: Props) {
  const options = useMemo(
    () => shuffled([...content.correct, ...content.distractors]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  )

  const correctSet = useMemo(() => new Set(content.correct), [content.correct])

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  function toggle(option: string) {
    if (submitted) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(option) ? next.delete(option) : next.add(option)
      return next
    })
  }

  function submit() {
    if (selected.size === 0) return
    setSubmitted(true)

    const allCorrectChosen = content.correct.every((o) => selected.has(o))
    const noDistractorChosen = content.distractors.every((o) => !selected.has(o))
    onResult(allCorrectChosen && noDistractorChosen ? 1 : 0)
  }

  function optionClass(option: string) {
    const isSelected = selected.has(option)
    const isCorrect  = correctSet.has(option)

    if (!submitted) {
      return isSelected
        ? 'bg-blue-500 text-white border-blue-500'
        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
    }

    // After submit:
    if (isSelected && isCorrect)  return 'bg-green-500 text-white border-green-500'  // ✓ correctly chosen
    if (isSelected && !isCorrect) return 'bg-red-500 text-white border-red-500'      // ✗ wrong pick
    if (!isSelected && isCorrect) return 'bg-amber-100 text-amber-800 border-amber-400' // missed
    return 'bg-white text-gray-300 border-gray-100'                                  // correctly skipped
  }

  return (
    <div className="space-y-8">
      <p className="text-2xl leading-relaxed text-gray-800">{content.prompt}</p>

      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => toggle(option)}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 text-left text-sm font-medium transition-colors ${optionClass(option)}`}
          >
            {/* Checkbox indicator */}
            <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              selected.has(option) ? 'border-current bg-current' : 'border-current'
            }`}>
              {selected.has(option) && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            {option}
          </button>
        ))}
      </div>

      {submitted && (
        <p className="text-sm text-gray-500">
          Correct answers highlighted in{' '}
          <span className="text-green-600 font-medium">green</span>
          {content.correct.some((o) => !selected.has(o)) && (
            <>, missed ones in <span className="text-amber-600 font-medium">amber</span></>
          )}
          .
        </p>
      )}

      {!submitted && (
        <button
          onClick={submit}
          disabled={selected.size === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          Check
        </button>
      )}
    </div>
  )
}
