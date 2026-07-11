'use client'

import { X, History, Clock, AlertTriangle, CheckCircle2, Info, Trash2 } from 'lucide-react'
import type { HistoryEntry } from '@/lib/types'

interface HistoryDrawerProps {
  open: boolean
  entries: HistoryEntry[]
  onClose: () => void
  onRestore: (entry: HistoryEntry) => void
  onClear: () => void
}

const SEVERITY_BADGE = {
  High: 'bg-[color:var(--severity-high)]/15 text-[color:var(--severity-high)] border-[color:var(--severity-high)]/30',
  Medium: 'bg-[color:var(--severity-medium)]/15 text-[color:var(--severity-medium)] border-[color:var(--severity-medium)]/30',
  Low: 'bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)] border-[color:var(--severity-low)]/30',
}

const SEVERITY_ICONS = {
  High: <AlertTriangle size={13} />,
  Medium: <Info size={13} />,
  Low: <CheckCircle2 size={13} />,
}

const ALERT_LABELS = {
  Anomaly: 'অ্যানোমালি',
  Liquidity: 'তারল্য',
  Normal: 'স্বাভাবিক',
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('en-BD', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function HistoryDrawer({ open, entries, onClose, onRestore, onClear }: HistoryDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-card border-l border-border flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Analysis History"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <History size={16} className="text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Analysis History</p>
              <p className="text-xs text-muted-foreground">বিশ্লেষণের ইতিহাস</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {entries.length > 0 && (
              <button
                onClick={onClear}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-[color:var(--severity-high)] hover:bg-[color:var(--severity-high)]/10 transition-colors"
              >
                <Trash2 size={12} />
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close history"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
              <History size={32} className="text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">কোনো ইতিহাস নেই।</p>
              <p className="text-xs text-muted-foreground/60">After running an analysis, it will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {[...entries].reverse().map((entry) => {
                const sty = SEVERITY_BADGE[entry.result.severity]
                const icon = SEVERITY_ICONS[entry.result.severity]
                const alertLabel = ALERT_LABELS[entry.result.alert_type]
                return (
                  <li key={entry.id}>
                    <button
                      onClick={() => { onRestore(entry); onClose() }}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sty}`}>
                            {icon}
                            {entry.result.severity}
                          </span>
                          <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                            {alertLabel}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          {entry.result.confidence_score}%
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed mb-1.5">
                        {entry.result.message_bn}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Clock size={10} />
                        {formatTime(entry.timestamp)}
                        <span className="mx-1">·</span>
                        <span className="font-mono">
                          ৳{(entry.request.balances.physicalCash + entry.request.balances.bkashBalance + entry.request.balances.nagadBalance + entry.request.balances.rocketBalance).toLocaleString()}
                        </span>
                        total
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border flex-shrink-0">
          <p className="text-[10px] text-muted-foreground/50 text-center">
            {entries.length} / 20 entries stored locally
          </p>
        </div>
      </aside>
    </>
  )
}
