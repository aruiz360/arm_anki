'use client'

import { useState, useMemo } from 'react'
import type { FillInContent } from '@/lib/db/types'

interface Props {
  id: string
  content: FillInContent
  onResult: (score: 0 | 1) => void
}

type BlankState = string | null // null = not yet selected

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// Split prompt into parts: plain text and [[n]] placeholders
function parsePrompt(prompt: string): Array<{ kind: 'text'; value: string } | { kind: 'blank'; index: number }> {
  const parts: ReturnType<typeof parsePrompt> = []
  const re = /\[\[(\d+)\]\]/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(prompt)) !== null) {
    if (match.index > last) parts.push({ kind: 'text', value: prompt.slice(last, match.index) })
    parts.push({ kind: 'blank', index: parseInt(match[1], 10) - 1 }) // 1-based → 0-based
    last = re.lastIndex
  }
  if (last < prompt.length) parts.push({ kind: 'text', value: prompt.slice(last) })

  return parts
}

export default function FillInExercise({ id, content, onResult }: Props) {
  const parts = useMemo(() => parsePrompt(content.prompt), [content.prompt])

  // Shuffle options once per exercise instance
  const allOptions = useMemo(
    () => content.blanks.map((b) => shuffled([...b.correct, ...b.distractors])),
    [content.blanks]
  )

  const [selections, setSelections] = useState<BlankState[]>(() => content.blanks.map(() => null))
  const [submitted, setSubmitted] = useState(false)

  const allSelected = selections.every((s) => s !== null)

  function select(blankIndex: number, value: string) {
    if (submitted) return
    setSelections((prev) => prev.map((s, i) => (i === blankIndex ? value : s)))
  }

  function submit() {
    if (!allSelected) return
    setSubmitted(true)

    const allCorrect = selections.every((sel, i) =>
      content.blanks[i].correct.includes(sel!)
    )
    onResult(allCorrect ? 1 : 0)
  }

  function blankClass(blankIndex: number, option: string) {
    const selected = selections[blankIndex] === option
    if (!submitted) return selected ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
    if (!selected) return 'bg-white text-gray-400'
    return content.blanks[blankIndex].correct.includes(option)
      ? 'bg-green-500 text-white'
      : 'bg-red-500 text-white'
  }

  return (
    <div className="space-y-8">
      {/* Prompt */}
      <p className="text-2xl leading-relaxed text-gray-800">
        {parts.map((part, i) => {
          if (part.kind === 'text') return <span key={i}>{part.value}</span>

          const sel = selections[part.index]
          return (
            <span
              key={i}
              className={`inline-block min-w-20 border-b-2 text-center font-semibold px-1 ${
                sel ? 'border-blue-500 text-blue-700' : 'border-gray-400 text-gray-400'
              }`}
            >
              {sel ?? '___'}
            </span>
          )
        })}
      </p>

      {/* Options per blank */}
      <div className="space-y-4">
        {content.blanks.map((blank, blankIndex) => (
          <div key={blankIndex} className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-400 w-5">{blankIndex + 1}.</span>
            {allOptions[blankIndex].map((option) => (
              <button
                key={option}
                onClick={() => select(blankIndex, option)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${blankClass(blankIndex, option)}`}
              >
                {option}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          onClick={submit}
          disabled={!allSelected}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          Check
        </button>
      )}
    </div>
  )
}
