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

// MULTI_SELECT: user picks all correct options from a combined pool.
// `correctIds` = all tokens that must be selected; `distractorIds` = wrong ones.
export const MultiSelectContent = z.object({
  prompt:        z.string(),
  correctIds:    z.array(z.string()).min(1),
  distractorIds: z.array(z.string()).min(1),
})

export type MultiSelectContent = z.infer<typeof MultiSelectContent>

// COLOR_LABEL: user assigns each target span the correct grammatical category.
// Context tokens (categoryId = null) are shown but not labeled.
// `categories` are embedded so each exercise can define its own label set.
export const ColorLabelContent = z.object({
  tokens: z.array(z.object({
    id:         z.string(),
    categoryId: z.string().nullable(),
  })).min(1),
  categories: z.array(z.object({
    id:    z.string(),
    label: z.string(),
    color: z.string(),
  })).min(1),
})

export type ColorLabelContent = z.infer<typeof ColorLabelContent>

// ---------------------------------------------------------------------------
// Discriminated union for parsing raw DB rows.
// ---------------------------------------------------------------------------
export const ExerciseContent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('FILL_IN'),       content: FillInContent }),
  z.object({ type: z.literal('ORDER'),          content: OrderContent }),
  z.object({ type: z.literal('MULTI_SELECT'),   content: MultiSelectContent }),
  z.object({ type: z.literal('COLOR_LABEL'),    content: ColorLabelContent }),
])

export type ExerciseContent = z.infer<typeof ExerciseContent>
