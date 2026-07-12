'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  History,
  Zap,
  RefreshCw,
  BarChart3,
  AlertCircle,
  LogIn,
  LogOut,
  User,
} from 'lucide-react'
import { BalanceCards } from '@/components/balance-cards'
import { TransactionForm } from '@/components/transaction-form'
import { RiskGauge } from '@/components/risk-gauge'
import { AlertPanel } from '@/components/alert-panel'
import { HistoryDrawer } from '@/components/history-drawer'
import { saveAnalysisResult } from '@/app/actions/analysis'
import { createLiquidityForecast } from '@/lib/liquidity-forecast'
import { useSession, signOut } from '@/lib/auth-client'
import Link from 'next/link'
import type {
  BalancesInput,
  Transaction,
  AnalysisResult,
  HistoryEntry,
} from '@/lib/types'

const DEFAULT_BALANCES: BalancesInput = {
  physicalCash: 5000,
  bkashBalance: 85000,
  nagadBalance: 10000,
  rocketBalance: 0,
}

const INITIAL_TIME = Date.now()
const DEFAULT_TRANSACTIONS: Omit<Transaction, 'id'>[] = [
  { provider: 'bKash', type: 'Cash Out', amount: 25000, status: 'Success', timestamp: INITIAL_TIME - 12 * 60 * 1000 },
  { provider: 'bKash', type: 'Cash Out', amount: 24500, status: 'Success', timestamp: INITIAL_TIME - 7 * 60 * 1000 },
  { provider: 'bKash', type: 'Cash Out', amount: 25000, status: 'Success', timestamp: INITIAL_TIME - 2 * 60 * 1000 },
]

const LS_KEY_HISTORY = 'alrip_history'
const LS_KEY_BALANCES = 'alrip_balances'
const LS_KEY_TRANSACTIONS = 'alrip_transactions'
const MAX_HISTORY = 20

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY_HISTORY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(LS_KEY_HISTORY, JSON.stringify(entries.slice(-MAX_HISTORY)))
}

function loadBalances(): BalancesInput {
  if (typeof window === 'undefined') return DEFAULT_BALANCES
  try {
    const raw = localStorage.getItem(LS_KEY_BALANCES)
    return raw ? (JSON.parse(raw) as BalancesInput) : DEFAULT_BALANCES
  } catch {
    return DEFAULT_BALANCES
  }
}

function saveBalances(balances: BalancesInput) {
  localStorage.setItem(LS_KEY_BALANCES, JSON.stringify(balances))
}

function loadTransactions(): Omit<Transaction, 'id'>[] {
  if (typeof window === 'undefined') return DEFAULT_TRANSACTIONS
  try {
    const raw = localStorage.getItem(LS_KEY_TRANSACTIONS)
    return raw ? (JSON.parse(raw) as Omit<Transaction, 'id'>[]) : DEFAULT_TRANSACTIONS
  } catch {
    return DEFAULT_TRANSACTIONS
  }
}

function saveTransactions(transactions: Omit<Transaction, 'id'>[]) {
  localStorage.setItem(LS_KEY_TRANSACTIONS, JSON.stringify(transactions))
}

function transactionImpact(transactions: Omit<Transaction, 'id'>[]): BalancesInput {
  return transactions.reduce<BalancesInput>(
    (impact, transaction) => {
      if (transaction.status !== 'Success' || transaction.amount <= 0) return impact

      const providerKey =
        transaction.provider === 'bKash'
          ? 'bkashBalance'
          : transaction.provider === 'Nagad'
            ? 'nagadBalance'
            : 'rocketBalance'

      if (transaction.type === 'Cash Out') {
        impact.physicalCash -= transaction.amount
        impact[providerKey] += transaction.amount
      } else if (transaction.type === 'Cash In') {
        impact.physicalCash += transaction.amount
        impact[providerKey] -= transaction.amount
      } else {
        impact[providerKey] -= transaction.amount
      }

      return impact
    },
    { physicalCash: 0, bkashBalance: 0, nagadBalance: 0, rocketBalance: 0 }
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [balances, setBalances] = useState<BalancesInput>(DEFAULT_BALANCES)
  const [transactions, setTransactions] = useState<Omit<Transaction, 'id'>[]>(DEFAULT_TRANSACTIONS)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    setHistory(loadHistory())
    setBalances(loadBalances())
    setTransactions(loadTransactions())
  }, [])

  useEffect(() => {
    saveBalances(balances)
  }, [balances])

  useEffect(() => {
    saveTransactions(transactions)
  }, [transactions])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setResult(createLiquidityForecast(balances, transactions))
      setError(null)
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [balances, transactions])

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balances,
          transactions,
          forecast: createLiquidityForecast(balances, transactions),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Analysis failed. Please try again.')
        return
      }
      const analysisResult = data as AnalysisResult
      setResult(analysisResult)

      // Persist to Neon if signed in (fire-and-forget, don't block UI)
      if (session?.user) {
        saveAnalysisResult({ balances, transactions }, analysisResult).catch(() => {})
      }

      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        request: { balances, transactions },
        result: analysisResult,
      }
      setHistory((prev) => {
        const updated = [...prev, entry].slice(-MAX_HISTORY)
        saveHistory(updated)
        return updated
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Check your connection.')
    } finally {
      setIsLoading(false)
    }
  }, [balances, transactions, session?.user])

  function handleRestore(entry: HistoryEntry) {
    setBalances(entry.request.balances)
    setTransactions(entry.request.transactions)
    setResult(entry.result)
  }

  function handleClearHistory() {
    setHistory([])
    localStorage.removeItem(LS_KEY_HISTORY)
  }

  function handleTransactionsChange(nextTransactions: Omit<Transaction, 'id'>[]) {
    const previousImpact = transactionImpact(transactions)
    const nextImpact = transactionImpact(nextTransactions)

    const updatedBalances = {
      physicalCash: Math.max(0, balances.physicalCash + nextImpact.physicalCash - previousImpact.physicalCash),
      bkashBalance: Math.max(0, balances.bkashBalance + nextImpact.bkashBalance - previousImpact.bkashBalance),
      nagadBalance: Math.max(0, balances.nagadBalance + nextImpact.nagadBalance - previousImpact.nagadBalance),
      rocketBalance: Math.max(0, balances.rocketBalance + nextImpact.rocketBalance - previousImpact.rocketBalance),
    }

    setBalances(updatedBalances)
    setTransactions(nextTransactions)
  }

  const totalBalance =
    balances.physicalCash +
    balances.bkashBalance +
    balances.nagadBalance +
    balances.rocketBalance

  const totalCashOut = transactions
    .filter((t) => t.type === 'Cash Out' && t.status === 'Success')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
              <Activity size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">ALRIP</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5 hidden sm:block">
                Agent Liquidity &amp; Risk Intelligence
              </p>
            </div>
          </div>

          {/* Center stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Total Balance</p>
              <p className="text-sm font-bold font-mono text-foreground">
                ৳{totalBalance.toLocaleString()}
              </p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Cash Out (15m)</p>
              <p className="text-sm font-bold font-mono text-[color:var(--severity-high)]">
                ৳{totalCashOut.toLocaleString()}
              </p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Transactions</p>
              <p className="text-sm font-bold font-mono text-foreground">{transactions.length}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="View history"
            >
              <History size={14} />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold">
                  {history.length}
                </span>
              )}
            </button>
            {/* Auth */}
            {session?.user ? (
              <div className="flex items-center gap-1">
                <span
                  title={session.user.email}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground bg-muted"
                >
                  <User size={12} />
                  <span className="hidden sm:inline max-w-[80px] truncate">
                    {session.user.name ?? session.user.email}
                  </span>
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-foreground text-balance">
            Agent Liquidity &amp; Risk Intelligence Platform
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            লাইভ ১৫-মিনিট পূর্বাভাস — কখন ক্যাশ শেষ হতে পারে এবং কোন provider চাপ তৈরি করছে
          </p>
        </div>

        {/* Balance Cards */}
        <section aria-label="Current balances">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-muted-foreground" />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Current Balances
            </h2>
          </div>
          <BalanceCards balances={balances} onChange={setBalances} />
        </section>

        {/* Transaction Form + Risk Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TransactionForm transactions={transactions} onChange={handleTransactionsChange} />
          </div>
          <div>
            <RiskGauge result={result} isLoading={isLoading} />
          </div>
        </div>

        {/* Alert Panel */}
        <section aria-label="Analysis result">
          <AlertPanel result={result} isLoading={isLoading} />
        </section>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-[color:var(--severity-high)]/40 bg-[color:var(--severity-high)]/5 p-4 flex gap-3">
            <AlertCircle size={16} className="text-[color:var(--severity-high)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[color:var(--severity-high)]">Analysis Error</p>
              <p className="text-xs text-foreground/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <div className="flex justify-center pt-2 pb-8">
          <button
            onClick={handleAnalyze}
            disabled={isLoading || transactions.length === 0}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                বিশ্লেষণ চলছে...
              </>
            ) : (
              <>
                <Zap size={16} />
                Analyze Now — এখনই বিশ্লেষণ করুন
              </>
            )}
          </button>
        </div>
      </main>

      {/* Drawers & Modals */}
      <HistoryDrawer
        open={historyOpen}
        entries={history}
        onClose={() => setHistoryOpen(false)}
        onRestore={handleRestore}
        onClear={handleClearHistory}
      />
    </div>
  )
}
