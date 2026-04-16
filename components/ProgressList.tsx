import type { ExerciseWithProgress } from '@/lib/repositories'

interface Props {
  exercises: ExerciseWithProgress[]
}

function buildSentence(tokens: string[]) {
  return tokens.reduce((acc, token) => {
    if (!acc) return token
    if (/^[.,!?;:]/.test(token)) return acc + token
    return acc + ' ' + token
  }, '')
}

function exercisePreview(ex: ExerciseWithProgress): string {
  if (ex.type === 'FILL_IN') {
    return ex.content.prompt.replace(/\[\[\d+\]\]/g, '___').slice(0, 60) + '…'
  }
  if (ex.type === 'ORDER') {
    const first = ex.content.validOrderings[0] ?? []
    return buildSentence(first).slice(0, 60) + '…'
  }
  if (ex.type === 'MULTI_SELECT') {
    return ex.content.prompt.slice(0, 60) + '…'
  }
  // COLOR_LABEL: join all token texts
  return buildSentence(ex.content.tokens.map((t) => t.text)).slice(0, 60) + '…'
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days  > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins  > 0) return `${mins}m ago`
  return 'just now'
}

export default function ProgressList({ exercises }: Props) {
  const done  = exercises.filter((ex) => ex.reps > 0).length
  const total = exercises.length

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          Exercises
        </h2>
        <span className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{done}</span> / {total} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
        />
      </div>

      {/* List */}
      <ul className="space-y-2">
        {exercises.map((ex) => {
          const isDone     = ex.reps > 0
          const isInactive = !ex.active
          return (
            <li
              key={ex.id}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                isInactive
                  ? 'bg-gray-50 border-gray-100 opacity-50'
                  : 'bg-white border-gray-100'
              }`}
            >
              {/* Status icon */}
              <span
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  isInactive
                    ? 'bg-gray-100 text-gray-300'
                    : isDone
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-300'
                }`}
              >
                {isInactive ? '–' : isDone ? '✓' : '○'}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isInactive ? 'text-gray-400' : 'text-gray-700'}`}>
                  {exercisePreview(ex)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isInactive
                    ? 'Inactive'
                    : isDone
                      ? `${ex.reps} rep${ex.reps > 1 ? 's' : ''} · last ${timeAgo(ex.lastReview!)}`
                      : 'Not yet reviewed'}
                </p>
              </div>

              {/* Type badge */}
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                  ex.type === 'FILL_IN'
                    ? 'bg-purple-50 text-purple-600'
                    : ex.type === 'ORDER'
                      ? 'bg-orange-50 text-orange-600'
                      : ex.type === 'MULTI_SELECT'
                        ? 'bg-sky-50 text-sky-600'
                        : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {ex.type === 'FILL_IN'
                  ? 'Fill in'
                  : ex.type === 'ORDER'
                    ? 'Order'
                    : ex.type === 'MULTI_SELECT'
                      ? 'Multi'
                      : 'Label'}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
