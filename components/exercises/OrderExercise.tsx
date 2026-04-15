'use client'

import { useState, useMemo } from 'react'
import type { OrderDisplay } from '@/lib/repositories'

interface Props {
  id: string
  content: OrderDisplay
  onResult: (score: 0 | 1) => void
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildSentence(tokens: string[]) {
  return tokens.reduce((acc, token) => {
    if (!acc) return token
    if (/^[.,!?;:]/.test(token)) return acc + token
    return acc + ' ' + token
  }, '')
}

export default function OrderExercise({ id, content, onResult }: Props) {
  const shuffledTokens = useMemo(() => shuffled(content.tokens), [content.tokens])

  const [arranged, setArranged] = useState<string[]>([])
  const [pool, setPool] = useState<string[]>(shuffledTokens)
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(false)

  function pickFromPool(token: string) {
    if (submitted) return
    setPool((prev) => {
      const i = prev.indexOf(token)
      return [...prev.slice(0, i), ...prev.slice(i + 1)]
    })
    setArranged((prev) => [...prev, token])
  }

  function returnToPool(index: number) {
    if (submitted) return
    const token = arranged[index]
    setArranged((prev) => prev.filter((_, i) => i !== index))
    setPool((prev) => [...prev, token])
  }

  function submit() {
    if (arranged.length !== content.tokens.length) return
    const isCorrect = content.validOrderings.some(
      (ord) =>
        ord.length === arranged.length &&
        ord.every((tok, i) => tok === arranged[i])
    )
    setCorrect(isCorrect)
    setSubmitted(true)
    onResult(isCorrect ? 1 : 0)
  }

  function reset() {
    setArranged([])
    setPool(shuffledTokens)
    setSubmitted(false)
    setCorrect(false)
  }

  return (
    <div className="space-y-8">
      {/* Answer area */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Your sentence</p>
        <div
          className={`min-h-14 flex flex-wrap gap-2 p-4 rounded-xl border-2 transition-colors ${
            !submitted
              ? 'border-gray-200 bg-gray-50'
              : correct
              ? 'border-green-400 bg-green-50'
              : 'border-red-400 bg-red-50'
          }`}
        >
          {arranged.length === 0 && (
            <span className="text-gray-300 text-sm self-center">Tap tokens below to build your sentence…</span>
          )}
          {arranged.map((token, i) => (
            <button
              key={i}
              onClick={() => returnToPool(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                submitted
                  ? correct
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : 'bg-red-100 border-red-300 text-red-800'
                  : 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50'
              }`}
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      {/* Token pool */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Tokens</p>
        <div className="flex flex-wrap gap-2">
          {pool.map((token, i) => (
            <button
              key={i}
              onClick={() => pickFromPool(token)}
              disabled={submitted}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-white border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {submitted && !correct && (
        <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 space-y-1">
          <p className="font-medium text-gray-700">
            Correct answer{content.validOrderings.length > 1 ? 's' : ''}:
          </p>
          {content.validOrderings.map((ordering, i) => (
            <p key={i} className="text-green-700">{buildSentence(ordering)}</p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!submitted && (
          <>
            <button
              onClick={submit}
              disabled={arranged.length !== content.tokens.length}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              Check
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 text-gray-500 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  )
}
