'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { analysisResults } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { AnalysisResult, AnalysisRequest } from '@/lib/types'

async function getUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export async function saveAnalysisResult(
  request: AnalysisRequest,
  result: AnalysisResult
) {
  const userId = await getUserId()
  if (!userId) return // Not signed in — skip persistence silently

  await db.insert(analysisResults).values({
    userId,
    alertType: result.alert_type,
    severity: result.severity,
    confidenceScore: result.confidence_score,
    messageBn: result.message_bn,
    evidence: result.evidence,
    recommendedAction: result.recommended_action,
    physicalCash: request.balances.physicalCash,
    bkashBalance: request.balances.bkashBalance,
    nagadBalance: request.balances.nagadBalance,
    rocketBalance: request.balances.rocketBalance,
    transactions: request.transactions as object,
  })

  revalidatePath('/')
}

export async function getAnalysisHistory(limit = 20) {
  const userId = await getUserId()
  if (!userId) return []

  return db
    .select()
    .from(analysisResults)
    .where(eq(analysisResults.userId, userId))
    .orderBy(desc(analysisResults.createdAt))
    .limit(limit)
}

export async function deleteAnalysisResult(id: number) {
  const userId = await getUserId()
  if (!userId) return

  await db
    .delete(analysisResults)
    .where(
      eq(analysisResults.id, id)
    )

  revalidatePath('/')
}
