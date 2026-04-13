import { z } from 'zod'

// ---------------------------------------------------------------------------
// FILL_IN
// Each blank maps to one entry in `blanks`, in order of [[1]], [[2]], etc.
// ---------------------------------------------------------------------------
export const FillInContent = z.object({
  prompt: z.string(), // e.g. "Hallo, [[1]] Tag. Ich [[2]] Andres..."
  blanks: z.array(
    z.object({
      correct: z.array(z.string()).min(1),     // one or more accepted answers
      distractors: z.array(z.string()).min(1), // wrong options shown alongside
    })
  ).min(1),
})

export type FillInContent = z.infer<typeof FillInContent>

// ---------------------------------------------------------------------------
// ORDER
// The user drags tokens into a correct sequence.
// Multiple valid orderings are supported.
// ---------------------------------------------------------------------------
export const OrderContent = z.object({
  validSentences: z.array(z.string()).min(1), // all accepted full-sentence answers
  tokens: z.array(z.string()).min(2),         // draggable pieces shown to the user
})

export type OrderContent = z.infer<typeof OrderContent>

// ---------------------------------------------------------------------------
// Discriminated union — use this to parse a raw DB row's `content` field.
// ---------------------------------------------------------------------------
export const ExerciseContent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('FILL_IN'), content: FillInContent }),
  z.object({ type: z.literal('ORDER'),   content: OrderContent }),
])

export type ExerciseContent = z.infer<typeof ExerciseContent>
