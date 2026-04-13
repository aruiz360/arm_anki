import { config } from 'dotenv'
config({ path: '.env.local' })
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { exercises } from '../lib/db/schema'
import type { FillInContent, OrderContent } from '../lib/db/types'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

// ---------------------------------------------------------------------------
// FILL_IN exercises
// ---------------------------------------------------------------------------
const fillInExercises: { type: 'FILL_IN'; content: FillInContent }[] = [
  {
    type: 'FILL_IN',
    content: {
      prompt: 'Hallo, [[1]] Tag. Ich [[2]] Andres und ich bin 27 Jahre [[3]].',
      blanks: [
        { correct: ['guten'],          distractors: ['lecker', 'kleinen'] },
        { correct: ['heisse', 'bin'],  distractors: ['name', 'esse'] },
        { correct: ['alt'],            distractors: ['gross', 'geboren'] },
      ],
    },
  },
  {
    type: 'FILL_IN',
    content: {
      prompt: 'Ich [[1]] aus Deutschland. Wo [[2]] du?',
      blanks: [
        { correct: ['komme'],  distractors: ['gehe', 'fahre'] },
        { correct: ['kommst'], distractors: ['gehst', 'bist'] },
      ],
    },
  },
  {
    type: 'FILL_IN',
    content: {
      prompt: 'Das [[1]] mein Bruder. Er [[2]] Fussball sehr [[3]].',
      blanks: [
        { correct: ['ist'],   distractors: ['hat', 'sind'] },
        { correct: ['spielt', 'mag'], distractors: ['isst', 'schreibt'] },
        { correct: ['gern'],  distractors: ['gut', 'schnell'] },
      ],
    },
  },
]

// ---------------------------------------------------------------------------
// ORDER exercises
// ---------------------------------------------------------------------------
const orderExercises: { type: 'ORDER'; content: OrderContent }[] = [
  {
    type: 'ORDER',
    content: {
      validSentences: [
        'Ich heisse Andres und ich bin 27 Jahre alt.',
        'Ich bin 27 Jahre alt und ich heisse Andres.',
      ],
      tokens: ['Ich', 'heisse', 'Andres', 'und', 'ich', 'bin', '27 Jahre alt', '.'],
    },
  },
  {
    type: 'ORDER',
    content: {
      validSentences: [
        'Mein Name ist Klaus und ich komme aus Berlin.',
      ],
      tokens: ['Mein Name', 'ist', 'Klaus', 'und', 'ich', 'komme', 'aus Berlin', '.'],
    },
  },
  {
    type: 'ORDER',
    content: {
      validSentences: [
        'Am Montag gehe ich in die Schule.',
        'Ich gehe am Montag in die Schule.',
      ],
      tokens: ['Am Montag', 'gehe', 'ich', 'in die Schule', '.'],
    },
  },
]

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
async function seed() {
  console.log('🌱 Seeding exercises...')

  await db.delete(exercises) // wipe before re-seeding

  const rows = [...fillInExercises, ...orderExercises]
  const inserted = await db.insert(exercises).values(rows).returning({ id: exercises.id, type: exercises.type })

  for (const row of inserted) {
    console.log(`  ✓ [${row.type}] ${row.id}`)
  }

  console.log(`\n✅ Seeded ${inserted.length} exercises.`)
  await client.end()
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
