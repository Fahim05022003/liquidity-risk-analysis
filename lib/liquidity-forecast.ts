import type {
  AnalysisResult,
  BalancesInput,
  Provider,
  Transaction,
} from '@/lib/types'

const WINDOW_MINUTES = 15
const WINDOW_MS = WINDOW_MINUTES * 60 * 1000

export function createLiquidityForecast(
  balances: BalancesInput,
  transactions: Omit<Transaction, 'id'>[],
  now = Date.now()
): AnalysisResult {
  const recent = transactions.filter((transaction) => {
    const timestamp = transaction.timestamp ?? now
    return transaction.status === 'Success' && timestamp >= now - WINDOW_MS && timestamp <= now
  })

  const cashOut = recent.filter((transaction) => transaction.type === 'Cash Out')
  const cashIn = recent.filter((transaction) => transaction.type === 'Cash In')
  const totalCashOut = cashOut.reduce((sum, transaction) => sum + transaction.amount, 0)
  const totalCashIn = cashIn.reduce((sum, transaction) => sum + transaction.amount, 0)
  const netDepletion = totalCashOut - totalCashIn
  const depletionRate = Math.max(0, netDepletion / WINDOW_MINUTES)

  const providerVolumes: Record<Provider, number> = {
    bKash: 0,
    Nagad: 0,
    Rocket: 0,
  }
  cashOut.forEach((transaction) => {
    providerVolumes[transaction.provider] += transaction.amount
  })

  const dominantProvider = (Object.entries(providerVolumes) as [Provider, number][])
    .sort((a, b) => b[1] - a[1])[0]
  const dominantShare = totalCashOut > 0
    ? Math.round((dominantProvider[1] / totalCashOut) * 100)
    : 0

  if (depletionRate <= 0 || totalCashOut <= 0) {
    return {
      alert_type: 'Normal',
      severity: 'Low',
      confidence_score: Math.min(90, 45 + recent.length * 8),
      message_bn: 'সাম্প্রতিক ১৫ মিনিটের সফল লেনদেন অনুযায়ী ফিজিক্যাল ক্যাশ কমে শেষ হয়ে যাওয়ার মতো চাপ দেখা যাচ্ছে না। লাইভ পর্যবেক্ষণ চালু আছে।',
      evidence: `Successful 15-minute cash flow is stable: cash out BDT ${totalCashOut.toLocaleString()}, cash in BDT ${totalCashIn.toLocaleString()}.`,
      recommended_action: 'Continue monitoring balances and review the forecast after new successful transactions.',
      forecast_rate_per_minute: 0,
      source: 'live_forecast',
    }
  }

  const minutesRemaining = Math.max(0, balances.physicalCash / depletionRate)
  const projectedAt = new Date(now + minutesRemaining * 60 * 1000)
  const severity = minutesRemaining <= 30 ? 'High' : minutesRemaining <= 60 ? 'Medium' : 'Low'
  const transactionCoverage = Math.min(25, recent.length * 6)
  const concentrationEvidence = Math.round(dominantShare * 0.2)
  const confidence = Math.min(96, 48 + transactionCoverage + concentrationEvidence)
  const roundedMinutes = Math.round(minutesRemaining)
  const rate = Math.round(depletionRate)

  const timeText = roundedMinutes <= 1 ? 'প্রায় ১ মিনিটের মধ্যে' : `প্রায় ${roundedMinutes} মিনিটের মধ্যে`
  const urgencyText = severity === 'High'
    ? 'এটি উচ্চ তারল্য ঝুঁকি এবং দ্রুত মানব পর্যালোচনা প্রয়োজন।'
    : 'অপারেশন সচল রাখতে আগাম প্রস্তুতি নেওয়া প্রয়োজন।'

  return {
    alert_type: 'Liquidity',
    severity,
    confidence_score: confidence,
    message_bn: `বর্তমান লেনদেনের গতি অপরিবর্তিত থাকলে ফিজিক্যাল ক্যাশ ${timeText} শেষ হতে পারে। ${dominantProvider[0]} ক্যাশ-আউট মোট ক্যাশ-আউটের ${dominantShare}% হওয়ায় এই চাপের প্রধান উৎস। ${urgencyText}`,
    evidence: `Net physical cash depletion is BDT ${netDepletion.toLocaleString()} over 15 minutes (about BDT ${rate.toLocaleString()}/minute). ${dominantProvider[0]} contributes ${dominantShare}% of successful Cash Out volume.`,
    recommended_action: `Ask the field officer to review recent ${dominantProvider[0]} Cash Out demand and arrange sufficient physical cash before ${projectedAt.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}.`,
    projected_exhaustion_minutes: roundedMinutes,
    projected_exhaustion_at: projectedAt.toISOString(),
    dominant_provider: dominantProvider[0],
    dominant_provider_share: dominantShare,
    forecast_rate_per_minute: rate,
    source: 'live_forecast',
  }
}
