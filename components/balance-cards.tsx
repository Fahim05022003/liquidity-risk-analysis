'use client'

import { Banknote, Smartphone, Zap, Rocket } from 'lucide-react'
import type { BalancesInput } from '@/lib/types'

interface BalanceCardsProps {
  balances: BalancesInput
  onChange: (balances: BalancesInput) => void
}

interface CardConfig {
  key: keyof BalancesInput
  label: string
  sublabel: string
  icon: React.ReactNode
  accentClass: string
  borderClass: string
  iconBgClass: string
}

const CARDS: CardConfig[] = [
  {
    key: 'physicalCash',
    label: 'Physical Cash',
    sublabel: 'নগদ টাকা',
    icon: <Banknote size={20} />,
    accentClass: 'text-[color:var(--cash)]',
    borderClass: 'border-[color:var(--cash)]/20 hover:border-[color:var(--cash)]/50',
    iconBgClass: 'bg-[color:var(--cash)]/10 text-[color:var(--cash)]',
  },
  {
    key: 'bkashBalance',
    label: 'bKash e-Money',
    sublabel: 'বিকাশ ব্যালেন্স',
    icon: <Smartphone size={20} />,
    accentClass: 'text-[color:var(--bkash)]',
    borderClass: 'border-[color:var(--bkash)]/20 hover:border-[color:var(--bkash)]/50',
    iconBgClass: 'bg-[color:var(--bkash)]/10 text-[color:var(--bkash)]',
  },
  {
    key: 'nagadBalance',
    label: 'Nagad e-Money',
    sublabel: 'নগদ ব্যালেন্স',
    icon: <Zap size={20} />,
    accentClass: 'text-[color:var(--nagad)]',
    borderClass: 'border-[color:var(--nagad)]/20 hover:border-[color:var(--nagad)]/50',
    iconBgClass: 'bg-[color:var(--nagad)]/10 text-[color:var(--nagad)]',
  },
  {
    key: 'rocketBalance',
    label: 'Rocket e-Money',
    sublabel: 'রকেট ব্যালেন্স',
    icon: <Rocket size={20} />,
    accentClass: 'text-[color:var(--rocket)]',
    borderClass: 'border-[color:var(--rocket)]/20 hover:border-[color:var(--rocket)]/50',
    iconBgClass: 'bg-[color:var(--rocket)]/10 text-[color:var(--rocket)]',
  },
]

function formatBDT(value: number): string {
  return new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function BalanceCards({ balances, onChange }: BalanceCardsProps) {
  function handleChange(key: keyof BalancesInput, raw: string) {
    const parsed = parseFloat(raw.replace(/,/g, '')) || 0
    onChange({ ...balances, [key]: parsed })
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className={`relative rounded-xl border bg-card p-4 transition-colors ${card.borderClass}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{card.sublabel}</p>
              <p className="text-sm font-semibold text-foreground leading-tight">{card.label}</p>
            </div>
            <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${card.iconBgClass}`}>
              {card.icon}
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
              ৳
            </span>
            <input
              type="number"
              min={0}
              value={balances[card.key] || ''}
              onChange={(e) => handleChange(card.key, e.target.value)}
              placeholder="0"
              className={`w-full bg-transparent border-b border-border pl-4 pb-1 text-xl font-bold font-mono ${card.accentClass} placeholder:text-muted-foreground/30 focus:outline-none focus:border-current transition-colors`}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground font-mono">
            {formatBDT(balances[card.key])} BDT
          </p>
        </div>
      ))}
    </div>
  )
}
