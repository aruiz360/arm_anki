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
      return {
        type: 'FILL_IN' as const,
        content: {
          prompt: (ex.content as any).prompt,
          blanks: (ex.content as any).blanks.map((b: any) => ({
            correctIds:    b.correctIds.map((id: string) => tokenIdMap.get(id)!),
            distractorIds: b.distractorIds.map((id: string) => tokenIdMap.get(id)!),
          })),
        },
      }
    }
    return {
      type: 'ORDER' as const,
      content: {
        tokenIds: (ex.content as any).tokenIds.map((id: string) => tokenIdMap.get(id)!),
        validOrderings: (ex.content as any).validOrderings.map((ord: string[]) =>
          ord.map((id) => tokenIdMap.get(id)!)
        ),
      },
    }
  })

  const exRows = await db.insert(exercises).values(remapped).returning({ id: exercises.id, type: exercises.type })
  console.log(`  ✓ ${exRows.length} exercises`)

  console.log(`\n✅ Seed complete.`)
  await client.end()
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
