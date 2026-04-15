import { z } from 'zod'

// ---------------------------------------------------------------------------
// STORAGE TYPES — what gets written to the `content` jsonb column.
// All references to tokens are by ID.
// ---------------------------------------------------------------------------

// FILL_IN: each blank lists which token IDs are correct and which are distractors.
export const FillInContent = z.object({
  prompt: z.string(), // e.g. "Hallo, [[1]] Tag. Ich [[2]] Andres..."
  blanks: z.array(
    z.object({
      correctIds:    z.array(z.string()).min(1),
      distractorIds: z.array(z.string()).min(1),
    })
  ).min(1),
})

export type FillInContent = z.infer<typeof FillInContent>

// ORDER: validOrderings are arrays of token IDs in accepted sequences.
// `tokenIds` is the pool shown to the user (will be shuffled in the UI).
export const OrderContent = z.object({
  validOrderings: z.array(z.array(z.string()).min(1)).min(1),
  tokenIds:       z.array(z.string()).min(2),
})

export type OrderContent = z.infer<typeof OrderContent>

// ---------------------------------------------------------------------------
// Discriminated union for parsing raw DB rows.
// ---------------------------------------------------------------------------
export const ExerciseContent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('FILL_IN'), content: FillInContent }),
  z.object({ type: z.literal('ORDER'),   content: OrderContent }),
])

export type ExerciseContent = z.infer<typeof ExerciseContent>
