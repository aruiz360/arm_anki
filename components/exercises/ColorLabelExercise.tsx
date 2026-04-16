'use client'

import { useState } from 'react'
import type { ColorLabelDisplay } from '@/lib/repositories'

interface Props {
  id: string
  content: ColorLabelDisplay
  onResult: (score: 0 | 1) => void
}

export default function ColorLabelExercise({ content, onResult }: Props) {
  const [activeCatId, setActiveCatId] = useState<string | null>(null)
  // assignments: token index → assigned categoryId
  const [assignments, setAssignments] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const targetIndices = content.tokens.reduce<number[]>((acc, t, i) => {
    if (t.categoryId !== null) acc.push(i)
    return acc
  }, [])

  const allAssigned = targetIndices.every((i) => assignments[i] !== undefined)

  const catById = Object.fromEntries(content.categories.map((c) => [c.id, c]))

  function clickToken(index: number) {
    if (submitted || !activeCatId || content.tokens[index].categoryId === null) return
    setAssignments((prev) => ({ ...prev, [index]: activeCatId }))
  }

  function submit() {
    if (!allAssigned) return
    setSubmitted(true)
    const allCorrect = targetIndices.every((i) => assignments[i] === content.tokens[i].categoryId)
    onResult(allCorrect ? 1 : 0)
  }

  // Returns Tailwind-compatible inline styles for a target token chip
  function chipStyle(index: number): React.CSSProperties {
    const assigned = assignments[index]
    if (!assigned) return { borderColor: '#d1d5db', color: '#6b7280', backgroundColor: '#f9fafb' }

    const cat = catById[assigned]
    if (!submitted) {
      return { borderColor: cat.color, color: cat.color, backgroundColor: cat.color + '18' }
    }
    const isCorrect = assigned === content.tokens[index].categoryId
    if (isCorrect) {
      return { borderColor: cat.color, color: cat.color, backgroundColor: cat.color + '18' }
    }
    return { borderColor: '#ef4444', color: '#ef4444', backgroundColor: '#fee2e2' }
  }

  return (
    <div className="space-y-8">
      {/* Category palette */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-gray-400">Select a category, then tap the matching words</p>
        <div className="flex flex-wrap gap-2">
          {content.categories.map((cat) => {
            const isActive = activeCatId === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCatId(isActive ? null : cat.id)}
                disabled={submitted}
                style={{
                  borderColor: cat.color,
                  backgroundColor: isActive ? cat.color : 'white',
                  color: isActive ? 'white' : cat.color,
                  boxShadow: isActive ? `0 0 0 3px ${cat.color}44` : undefined,
                }}
                className="px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all disabled:opacity-50"
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sentence */}
      <div className="text-xl leading-loose flex flex-wrap gap-x-1 gap-y-3 items-end">
        {content.tokens.map((token, i) => {
          const isTarget = token.categoryId !== null
          const assigned = assignments[i]

          if (!isTarget) {
            return (
              <span key={i} className="text-gray-700">
                {/^[.,!?;:]/.test(token.text) ? token.text : ` ${token.text}`}
              </span>
            )
          }

          const isWrong = submitted && assigned !== token.categoryId
          const correctCat = token.categoryId ? catById[token.categoryId] : null

          return (
            <span key={i} className="inline-flex flex-col items-center gap-0.5">
              <button
                onClick={() => clickToken(i)}
                style={chipStyle(i)}
                className={`px-3 py-1 rounded-lg border-2 text-sm font-semibold transition-all ${
                  !submitted && activeCatId ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
                }`}
              >
                {token.text}
                {submitted && assigned === token.categoryId && (
                  <span className="ml-1.5 opacity-70">✓</span>
                )}
              </button>
              {/* Show correct label below wrong answers */}
              {isWrong && correctCat && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ color: correctCat.color, backgroundColor: correctCat.color + '18' }}
                >
                  {correctCat.label}
                </span>
              )}
            </span>
          )
        })}
      </div>

      {!submitted && (
        <button
          onClick={submit}
          disabled={!allAssigned}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          Check
        </button>
      )}
    </div>
  )
}
