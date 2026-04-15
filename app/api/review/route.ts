import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getExerciseRepository } from '@/lib/repositories'

const Body = z.object({
  exerciseId: z.string().min(1), // accepts both UUIDs and mock IDs
  score: z.number().min(0).max(1),
})

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json())

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { exerciseId, score } = parsed.data
  const repo = getExerciseRepository()
  await repo.recordScore(exerciseId, score)

  return NextResponse.json({ ok: true })
}
