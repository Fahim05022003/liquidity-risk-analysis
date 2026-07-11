'use client'

import { AlertTriangle, CheckCircle2, Info, ShieldAlert, ClipboardList } from 'lucide-react'
import type { AnalysisResult } from '@/lib/types'

interface AlertPanelProps {
  result: AnalysisResult | null
  isLoading?: boolean
}

const SEVERITY_STYLES = {
  High: {
    border: 'border-[color:var(--severity-high)]/40',
    bg: 'bg-[color:var(--severity-high)]/5',
    iconColor: 'text-[color:var(--severity-high)]',
    iconBg: 'bg-[color:var(--severity-high)]/10',
    badge: 'bg-[color:var(--severity-high)]/15 text-[color:var(--severity-high)] border-[color:var(--severity-high)]/40',
    pulse: 'bg-[color:var(--severity-high)]',
    icon: <AlertTriangle size={18} />,
    label: 'High',
  },
  Medium: {
    border: 'border-[color:var(--severity-medium)]/40',
    bg: 'bg-[color:var(--severity-medium)]/5',
    iconColor: 'text-[color:var(--severity-medium)]',
    iconBg: 'bg-[color:var(--severity-medium)]/10',
    badge: 'bg-[color:var(--severity-medium)]/15 text-[color:var(--severity-medium)] border-[color:var(--severity-medium)]/40',
    pulse: 'bg-[color:var(--severity-medium)]',
    icon: <Info size={18} />,
    label: 'Medium',
  },
  Low: {
    border: 'border-[color:var(--severity-low)]/40',
    bg: 'bg-[color:var(--severity-low)]/5',
    iconColor: 'text-[color:var(--severity-low)]',
    iconBg: 'bg-[color:var(--severity-low)]/10',
    badge: 'bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)] border-[color:var(--severity-low)]/40',
    pulse: 'bg-[color:var(--severity-low)]',
    icon: <CheckCircle2 size={18} />,
    label: 'Low',
  },
}

const ALERT_TYPE_LABELS = {
  Anomaly: 'অস্বাভাবিক কার্যকলাপ',
  Liquidity: 'তারল্য ঝুঁকি',
  Normal: 'স্বাভাবিক অবস্থা',
}

export function AlertPanel({ result, isLoading }: AlertPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
          <div className="h-3 w-3/5 rounded bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center gap-2 min-h-[140px]">
        <ShieldAlert size={28} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground text-center">
          এখনো কোনো বিশ্লেষণ হয়নি।
        </p>
        <p className="text-xs text-muted-foreground/60 text-center">
          তথ্য পূরণ করে &ldquo;Analyze Now&rdquo; বাটনে ক্লিক করুন।
        </p>
      </div>
    )
  }

  const sty = SEVERITY_STYLES[result.severity]
  const alertLabel = ALERT_TYPE_LABELS[result.alert_type]

  return (
    <div className={`rounded-xl border ${sty.border} ${sty.bg} p-4 flex flex-col gap-4`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg ${sty.iconBg} ${sty.iconColor}`}>
          {sty.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-foreground">{alertLabel}</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sty.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sty.pulse}`} />
              {sty.label} Severity
            </span>
            <span className="text-[10px] text-muted-foreground font-mono border border-border rounded px-1.5 py-0.5">
              {result.alert_type}
            </span>
          </div>
        </div>
      </div>

      {/* Bengali message */}
      <div className="rounded-lg bg-background/50 border border-border p-3">
        <p className="text-xs text-muted-foreground mb-1 font-medium">বিশ্লেষণ বার্তা</p>
        <p className="text-sm text-foreground leading-relaxed">{result.message_bn}</p>
      </div>

      {/* Evidence */}
      <div className="flex gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <Info size={13} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Evidence</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{result.evidence}</p>
        </div>
      </div>

      {/* Recommended Action */}
      <div className="rounded-lg border border-border bg-muted/40 p-3 flex gap-2">
        <ClipboardList size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Recommended Action</p>
          <p className="text-xs text-foreground leading-relaxed">{result.recommended_action}</p>
        </div>
      </div>
    </div>
  )
}
