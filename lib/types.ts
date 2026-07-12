export type Provider = 'bKash' | 'Nagad' | 'Rocket'
export type TxType = 'Cash Out' | 'Cash In' | 'Send Money' | 'Payment'
export type TxStatus = 'Success' | 'Failed' | 'Pending'

export interface Transaction {
  id: string
  provider: Provider
  type: TxType
  amount: number
  status: TxStatus
  timestamp?: number
}

export interface BalancesInput {
  physicalCash: number
  bkashBalance: number
  nagadBalance: number
  rocketBalance: number
}

export interface AnalysisRequest {
  balances: BalancesInput
  transactions: Omit<Transaction, 'id'>[]
}

export type AlertType = 'Liquidity' | 'Anomaly' | 'Normal'
export type Severity = 'High' | 'Medium' | 'Low'

export interface AnalysisResult {
  alert_type: AlertType
  severity: Severity
  confidence_score: number
  message_bn: string
  evidence: string
  recommended_action: string
  projected_exhaustion_minutes?: number
  projected_exhaustion_at?: string
  dominant_provider?: Provider
  dominant_provider_share?: number
  forecast_rate_per_minute?: number
  source?: 'live_forecast' | 'ai_analysis'
}

export interface HistoryEntry {
  id: string
  timestamp: number
  request: AnalysisRequest
  result: AnalysisResult
}
