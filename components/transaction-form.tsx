'use client'

import { useState } from 'react'
import { PlusCircle, Trash2 } from 'lucide-react'
import type { Transaction, Provider, TxType, TxStatus } from '@/lib/types'

interface TransactionFormProps {
  transactions: Omit<Transaction, 'id'>[]
  onChange: (transactions: Omit<Transaction, 'id'>[]) => void
}

const PROVIDERS: Provider[] = ['bKash', 'Nagad', 'Rocket']
const TX_TYPES: TxType[] = ['Cash Out', 'Cash In', 'Send Money', 'Payment']
const TX_STATUSES: TxStatus[] = ['Success', 'Failed', 'Pending']

const PROVIDER_STYLES: Record<Provider, string> = {
  bKash: 'text-[color:var(--bkash)] bg-[color:var(--bkash)]/10 border-[color:var(--bkash)]/30',
  Nagad: 'text-[color:var(--nagad)] bg-[color:var(--nagad)]/10 border-[color:var(--nagad)]/30',
  Rocket: 'text-[color:var(--rocket)] bg-[color:var(--rocket)]/10 border-[color:var(--rocket)]/30',
}

const STATUS_STYLES: Record<TxStatus, string> = {
  Success: 'text-[color:var(--cash)] bg-[color:var(--cash)]/10 border-[color:var(--cash)]/30',
  Failed: 'text-[color:var(--severity-high)] bg-[color:var(--severity-high)]/10 border-[color:var(--severity-high)]/30',
  Pending: 'text-[color:var(--severity-medium)] bg-[color:var(--severity-medium)]/10 border-[color:var(--severity-medium)]/30',
}

function emptyTx(): Omit<Transaction, 'id'> {
  return {
    provider: 'bKash',
    type: 'Cash Out',
    amount: 0,
    status: 'Success',
    timestamp: Date.now(),
  }
}

const selectClass =
  'w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors'

export function TransactionForm({ transactions, onChange }: TransactionFormProps) {
  function addRow() {
    onChange([...transactions, emptyTx()])
  }

  function removeRow(index: number) {
    onChange(transactions.filter((_, i) => i !== index))
  }

  function updateRow(index: number, field: keyof Omit<Transaction, 'id'>, value: string | number) {
    const updated = transactions.map((tx, i) =>
      i === index ? { ...tx, timestamp: tx.timestamp ?? Date.now(), [field]: value } : tx
    )
    onChange(updated)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
          <p className="text-xs text-muted-foreground">সাম্প্রতিক লেনদেন — গত ১৫ মিনিট</p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <PlusCircle size={13} />
          Add Row
        </button>
      </div>

      {transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">কোনো লেনদেন নেই।</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Click &ldquo;Add Row&rdquo; to add transactions.</p>
        </div>
      )}

      <div className="space-y-2">
        {transactions.map((tx, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center"
          >
            {/* Provider */}
            <div className="relative">
              <select
                value={tx.provider}
                onChange={(e) => updateRow(i, 'provider', e.target.value as Provider)}
                className={selectClass}
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span
                className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded border pointer-events-none ${PROVIDER_STYLES[tx.provider]}`}
              >
                {tx.provider}
              </span>
            </div>

            {/* Type */}
            <select
              value={tx.type}
              onChange={(e) => updateRow(i, 'type', e.target.value as TxType)}
              className={selectClass}
            >
              {TX_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Amount */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">৳</span>
              <input
                type="number"
                min={0}
                value={tx.amount || ''}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value) || 0
                  updateRow(i, 'amount', Math.max(0, parsed))
                }}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-muted pl-7 pr-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Status */}
            <select
              value={tx.status}
              onChange={(e) => updateRow(i, 'status', e.target.value as TxStatus)}
              className={`${selectClass} border ${STATUS_STYLES[tx.status]}`}
            >
              {TX_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-[color:var(--severity-high)] hover:bg-[color:var(--severity-high)]/10 transition-colors"
              aria-label="Remove transaction"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {transactions.length > 0 && (
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{transactions.length}</span> transaction{transactions.length !== 1 ? 's' : ''} added
          </p>
          <span className="text-muted-foreground/30">·</span>
          <p className="text-xs text-muted-foreground font-mono">
            Total: ৳{transactions.reduce((s, t) => s + t.amount, 0).toLocaleString()} BDT
          </p>
        </div>
      )}
    </div>
  )
}
