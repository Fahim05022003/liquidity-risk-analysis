'use client'

import type { AnalysisResult } from '@/lib/types'

interface RiskGaugeProps {
  result: AnalysisResult | null
  isLoading?: boolean
}

const SEVERITY_CONFIG = {
  High: {
    color: 'var(--severity-high)',
    label: 'উচ্চ ঝুঁকি',
    sublabel: 'High Risk',
    glow: 'drop-shadow(0 0 8px oklch(0.65 0.22 25 / 0.6))',
  },
  Medium: {
    color: 'var(--severity-medium)',
    label: 'মাঝারি ঝুঁকি',
    sublabel: 'Medium Risk',
    glow: 'drop-shadow(0 0 8px oklch(0.72 0.18 60 / 0.6))',
  },
  Low: {
    color: 'var(--severity-low)',
    label: 'স্বাভাবিক',
    sublabel: 'Low Risk',
    glow: 'drop-shadow(0 0 8px oklch(0.70 0.17 145 / 0.6))',
  },
} as const

const ALERT_CONFIG = {
  Anomaly: { label: 'অ্যানোমালি', badge: 'bg-[color:var(--severity-high)]/15 text-[color:var(--severity-high)] border-[color:var(--severity-high)]/30' },
  Liquidity: { label: 'তারল্য সংকট', badge: 'bg-[color:var(--severity-medium)]/15 text-[color:var(--severity-medium)] border-[color:var(--severity-medium)]/30' },
  Normal: { label: 'স্বাভাবিক', badge: 'bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)] border-[color:var(--severity-low)]/30' },
}

function buildArc(score: number): string {
  // The gauge is a 220-degree arc (from 250deg to 110deg clockwise)
  const R = 70
  const cx = 100
  const cy = 100
  const startDeg = 220
  const totalDeg = 260
  const endDeg = startDeg - (score / 100) * totalDeg

  const toRad = (d: number) => (d * Math.PI) / 180
  const x1 = cx + R * Math.cos(toRad(startDeg))
  const y1 = cy - R * Math.sin(toRad(startDeg))
  const x2 = cx + R * Math.cos(toRad(endDeg))
  const y2 = cy - R * Math.sin(toRad(endDeg))
  const large = (score / 100) * totalDeg > 180 ? 1 : 0

  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`
}

function buildTrack(): string {
  const R = 70
  const cx = 100
  const cy = 100
  const startDeg = 220
  const endDeg = -40
  const toRad = (d: number) => (d * Math.PI) / 180
  const x1 = cx + R * Math.cos(toRad(startDeg))
  const y1 = cy - R * Math.sin(toRad(startDeg))
  const x2 = cx + R * Math.cos(toRad(endDeg))
  const y2 = cy - R * Math.sin(toRad(endDeg))
  return `M ${x1} ${y1} A ${R} ${R} 0 1 1 ${x2} ${y2}`
}

export function RiskGauge({ result, isLoading }: RiskGaugeProps) {
  const score = result?.confidence_score ?? 0
  const severity = result?.severity ?? 'Low'
  const alertType = result?.alert_type ?? 'Normal'

  const cfg = SEVERITY_CONFIG[severity]
  const alertCfg = ALERT_CONFIG[alertType]
  const arcPath = buildArc(score)
  const trackPath = buildTrack()

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Risk Score</h2>
          <p className="text-xs text-muted-foreground">ঝুঁকি সূচক</p>
        </div>
        {result && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${alertCfg.badge}`}>
            {alertCfg.label}
          </span>
        )}
      </div>

      <div className="relative w-[200px] h-[140px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : (
          <svg viewBox="0 0 200 160" className="w-full h-full" aria-hidden="true">
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--severity-low)" />
                <stop offset="50%" stopColor="var(--severity-medium)" />
                <stop offset="100%" stopColor="var(--severity-high)" />
              </linearGradient>
            </defs>
            {/* Track */}
            <path
              d={trackPath}
              fill="none"
              stroke="oklch(1 0 0 / 6%)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Arc */}
            {score > 0 && (
              <path
                d={arcPath}
                fill="none"
                stroke={cfg.color}
                strokeWidth="12"
                strokeLinecap="round"
                style={{ filter: cfg.glow }}
              />
            )}
            {/* Score text */}
            <text
              x="100"
              y="108"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="28"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
              fill={result ? cfg.color : 'oklch(1 0 0 / 25%)'}
            >
              {score}
            </text>
            <text
              x="100"
              y="126"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="oklch(1 0 0 / 40%)"
              fontFamily="Inter, sans-serif"
            >
              CONFIDENCE
            </text>
          </svg>
        )}
      </div>

      {result ? (
        <div className="text-center mt-1">
          <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
          <p className="text-xs text-muted-foreground">{cfg.sublabel}</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center mt-2">
          {isLoading ? 'বিশ্লেষণ চলছে...' : 'বিশ্লেষণ করতে নিচের বাটনে ক্লিক করুন'}
        </p>
      )}
    </div>
  )
}
