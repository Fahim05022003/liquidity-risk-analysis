import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { AnalysisRequest, AnalysisResult } from '@/lib/types'

const SYSTEM_PROMPT = `You are an intelligent AI assistant for a "Super Agent Liquidity & Risk Intelligence Platform". Your job is to analyze multi-provider financial transaction data (bKash, Nagad, Rocket) and identify potential liquidity shortages or unusual activities.

CRITICAL RULES — you MUST follow all of these without exception:
1. NEVER use the word "Fraud" or "Scam". Use phrases like "Unusual activity", "Requires review", or "Anomaly detected" instead.
2. Do NOT recommend automatic blocking or financial actions. Only suggest human review or safe operational steps (e.g., "Arrange more physical cash").
3. Always provide a "confidence_score" (integer, 0–100) based on the evidence quality.
4. Your response MUST be valid JSON — no markdown, no code fences, no extra text.
5. The "message_bn" field MUST be written in clear, natural Bengali (Bangla) language.
6. Be conservative: a Normal alert with Low severity is valid and expected when there is no risk.

Response schema (return ONLY this JSON object):
{
  "alert_type": "Liquidity" | "Anomaly" | "Normal",
  "severity": "High" | "Medium" | "Low",
  "confidence_score": number (0–100),
  "message_bn": "Bengali explanation of findings",
  "evidence": "Concise English explanation of why this was flagged",
  "recommended_action": "Concise English action steps for the agent or field officer"
}`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as AnalysisRequest & { forecast?: AnalysisResult }
    const { balances, transactions, forecast } = body

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({ apiKey })

    const userContent = `Analyze the following agent data and determine if there are any liquidity risks or unusual transaction patterns.

Current Balances:
- Physical Cash: ${balances.physicalCash.toLocaleString()} BDT
- bKash e-money: ${balances.bkashBalance.toLocaleString()} BDT
- Nagad e-money: ${balances.nagadBalance.toLocaleString()} BDT
- Rocket e-money: ${balances.rocketBalance.toLocaleString()} BDT
- Total e-money: ${(balances.bkashBalance + balances.nagadBalance + balances.rocketBalance).toLocaleString()} BDT
- Grand Total: ${(balances.physicalCash + balances.bkashBalance + balances.nagadBalance + balances.rocketBalance).toLocaleString()} BDT

Recent Transactions (Last 15 minutes):
${JSON.stringify(transactions, null, 2)}

Deterministic Liquidity Forecast Evidence:
${forecast ? JSON.stringify(forecast, null, 2) : 'No deterministic forecast supplied.'}

When forecast evidence is supplied, use its projected exhaustion timing and dominant-provider attribution as quantitative evidence. Explain it clearly in Bengali, but do not recommend blocking or automatic financial action.

Provide your analysis strictly following the rules in the system prompt. Respond ONLY with the JSON object.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    let result: AnalysisResult

    try {
      result = JSON.parse(raw) as AnalysisResult
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response as JSON.', raw }, { status: 500 })
    }

    // Validate required fields
    const required = ['alert_type', 'severity', 'confidence_score', 'message_bn', 'evidence', 'recommended_action']
    for (const field of required) {
      if (!(field in result)) {
        return NextResponse.json({ error: `Missing field in AI response: ${field}`, raw }, { status: 500 })
      }
    }

    return NextResponse.json({
      ...result,
      projected_exhaustion_minutes: forecast?.projected_exhaustion_minutes,
      projected_exhaustion_at: forecast?.projected_exhaustion_at,
      dominant_provider: forecast?.dominant_provider,
      dominant_provider_share: forecast?.dominant_provider_share,
      forecast_rate_per_minute: forecast?.forecast_rate_per_minute,
      source: 'ai_analysis',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error.'
    // Handle OpenAI auth errors gracefully
    if (message.includes('401') || message.includes('Incorrect API key')) {
      return NextResponse.json({ error: 'Invalid OpenAI API key. Please check and update your key.' }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
