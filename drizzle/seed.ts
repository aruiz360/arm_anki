import { config } from 'dotenv'
config({ path: '.env' })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  tokenTypes,
  tokens,
  exercises,
} from '../lib/db/schema'
import mockData from '../lib/mocks/data.json'
import type { FillInContent, MultiSelectContent, ColorLabelContent, OrderContent } from '../lib/db/types'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

// ---------------------------------------------------------------------------
// Seeds real tokens from the mock JSON. Token type & token IDs are mapped
// from readable mock IDs (e.g. "tk-heisse") to generated UUIDs.
// ---------------------------------------------------------------------------
async function seed() {
  console.log('🌱 Seeding…')

  // Wipe in FK-safe order
  await db.delete(exercises)
  await db.delete(tokens)
  await db.delete(tokenTypes)

  // 1. token_types
  const typeIdMap = new Map<string, string>()
  const typeRows = await db
    .insert(tokenTypes)
    .values(mockData.tokenTypes.map((t) => ({
      label:       t.label,
      description: null,
      color:       t.color,
    })))
    .returning()
  mockData.tokenTypes.forEach((mock, i) => typeIdMap.set(mock.id, typeRows[i].id))
  console.log(`  ✓ ${typeRows.length} token types`)

  // 2. tokens
  const tokenIdMap = new Map<string, string>()
  const tokenRows = await db
    .insert(tokens)
    .values(mockData.tokens.map((t) => ({
      text:   t.text,
      typeId: typeIdMap.get(t.typeId)!,
    })))
    .returning()
  mockData.tokens.forEach((mock, i) => tokenIdMap.set(mock.id, tokenRows[i].id))
  console.log(`  ✓ ${tokenRows.length} tokens`)

  // 3. exercises — rewrite content to use real token UUIDs
  const remapped = mockData.exercises.map((ex) => {
    if (ex.type === 'FILL_IN') {
      const c = ex.content as unknown as FillInContent
      return {
        type: 'FILL_IN' as const,
        content: {
          prompt: c.prompt,
          blanks: c.blanks.map((b) => ({
            correctIds:    b.correctIds.map((id) => tokenIdMap.get(id)!),
            distractorIds: b.distractorIds.map((id) => tokenIdMap.get(id)!),
          })),
        },
      }
    }
    if (ex.type === 'MULTI_SELECT') {
      const c = ex.content as unknown as MultiSelectContent
      return {
        type: 'MULTI_SELECT' as const,
        content: {
          prompt:        c.prompt,
          correctIds:    c.correctIds.map((id) => tokenIdMap.get(id)!),
          distractorIds: c.distractorIds.map((id) => tokenIdMap.get(id)!),
        },
      }
    }
    if (ex.type === 'COLOR_LABEL') {
      const c = ex.content as unknown as ColorLabelContent
      return {
        type: 'COLOR_LABEL' as const,
        content: {
          tokens: c.tokens.map((t) => ({
            id:         tokenIdMap.get(t.id)!,
            categoryId: t.categoryId,
          })),
          categories: c.categories,
        },
      }
    }
    const c = ex.content as unknown as OrderContent
    return {
      type: 'ORDER' as const,
      content: {
        tokenIds:       c.tokenIds.map((id) => tokenIdMap.get(id)!),
        validOrderings: c.validOrderings.map((ord) => ord.map((id) => tokenIdMap.get(id)!)),
      },
    }
  })

  const exRows = await db.insert(exercises).values(
    remapped.map((ex) => ({ ...ex, active: true }))
  ).returning({ id: exercises.id, type: exercises.type })
  console.log(`  ✓ ${exRows.length} exercises`)

  console.log(`\n✅ Seed complete.`)
  await client.end()
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
